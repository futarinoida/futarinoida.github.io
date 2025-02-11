import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.Tag;
import com.drew.metadata.exif.ExifIFD0Directory;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.Collator;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.text.StringEscapeUtils;
import org.mozilla.universalchardet.UniversalDetector;

public class Gen {
    private static final Logger logger = LoggerFactory.getLogger(Gen.class);
    private static List<String> bookList = new ArrayList<>();
    private static List<String> imageList = new ArrayList<>();
    private static Metadata imageMetadata = null;
    private static List<String> audioList = new ArrayList<>();
    private static List<String> videoList = new ArrayList<>();
    private static int idCounter = 0;
    private static String generateUniqueId() {
        return "id_" + (idCounter++);
    }

    public static void main(String[] args) {
        try {
            func();
        } catch (Exception e) {
            logger.error(e.getMessage(),e);
        }
    }

    private static void func() throws Exception {
        Properties props = new Properties();
        try (InputStream input = new FileInputStream("config.properties")) {
            props.load(input);
        }

        Path htmlDir = Paths.get(props.getProperty("htmlDir"));
        Path bookDir = Paths.get(props.getProperty("bookDir"));
        Path imageDir = Paths.get(props.getProperty("imageDir"));
        Path audioDir = Paths.get(props.getProperty("audioDir"));
        Path videoDir = Paths.get(props.getProperty("videoDir"));
        Path sideHtml = Paths.get(props.getProperty("sideHtml"));
        Path wallpaperJS = Paths.get(props.getProperty("wallpaperJS"));
        Path dataJs = Paths.get(props.getProperty("dataJs"));
        Path wallpaperDir = Paths.get(props.getProperty("wallpaperDir"));
        List<String> excludeFiles = Arrays.asList(props.getProperty("exclude").split("\\|"));

        //处理txt文件
        txtToHtml(bookDir, Paths.get("append.txt"));

        Map<String, List<String>> articlesByCategory = new HashMap<>();
        List<String> volume = new LinkedList<>();

        Files.list(htmlDir)
                .filter(path -> path.toString().endsWith(".html"))
                .forEach(path -> {

                    String fileName = path.getFileName().toString().split(".html")[0];
                    volume.add(fileName);
                    Document doc;
                    try {
                        doc = Jsoup.parse(path.toFile(), "UTF-8");
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                    if (excludeFiles.contains(fileName)) {
                        Element timeStampElement = doc.getElementById("anchor");
                        volume.add(timeStampElement != null ? timeStampElement.text() : "");
                    } else {
                        volume.add(doc.body().text()
                                .replaceAll("\r\n|\r|\n", " ")
                                .replaceAll("(\\\\)(\\d+)", "$1 $2")
                                .replaceAll(" +", " ")
                                .replaceAll("\\$\\{", "&#36;{")
                                .replaceAll("`", "&#715;")
                        );
                    }
                    volume.add("");
                    volume.add("html");

                    try {
                        String content = new String(Files.readAllBytes(path));
                        Pattern pattern = Pattern.compile("<span id=\"anchor\">(\\d+)-(.+)</span>");

                        Matcher matcher = pattern.matcher(content);
                        if (matcher.find()) {
                            String timestamp = matcher.group(1);
                            String category = matcher.group(2);
                            articlesByCategory.computeIfAbsent(category, k -> new ArrayList<>())
                                    .add("<li><a href=\"../html/" + path.getFileName() + "\" data-stamp=\"" + timestamp + "\" target=\"content\">" + path.getFileName().toString().replace(".html", "") + "</a></li>");
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                });

        StringBuilder stb = new StringBuilder();

        Map<String, List<String>> sortedMap = new LinkedHashMap<>();
        List<String> sortedKeys = new ArrayList<>(articlesByCategory.keySet());
        Collections.sort(sortedKeys,new ChineseStringComparator());
        for (String key : sortedKeys) {
            sortedMap.put(key, articlesByCategory.get(key));
        }
        //按时间戳排序
        for (Map.Entry<String, List<String>> entry : articlesByCategory.entrySet()) {
            entry.setValue(sortArticlesByDataStamp(entry.getValue()));
        }
        for (Map.Entry<String, List<String>> entry : sortedMap.entrySet()) {
            String _category = entry.getKey();
            List<String> articles = entry.getValue();
            //Collections.sort(articles,new ChineseStringComparator());
            String category = new String(_category.getBytes(), "UTF-8");
            stb.append("<span class=\"category inactive\" onclick=\"toggle('").append(category).append("_html')\">").append(category).append("</span>\n");
            stb.append("<ul id=\"").append(category).append("_html\" class=\"hidden\">\n");
            for (String article : articles) {
                stb.append(article).append("\n");
            }
            stb.append("</ul>\n");
        }

        Document doc = Jsoup.parse(sideHtml.toFile(), "UTF-8");
        Element genElement = doc.getElementById("html");
        genElement.empty();
        genElement.append(stb.toString());
        boolean flag = false;
        String p = scanBook(bookDir);
        if(p!=null){
            genElement = doc.getElementById("book");
            genElement.empty();
            genElement.append(p);
            flag = true;
        }
        boolean flag2 = false;
        String im = scanImage(imageDir);
        if(im!=null){
            genElement = doc.getElementById("gallery");
            genElement.empty();
            genElement.append(im);
            flag2 = true;
        }
        boolean flag4 = false;
        String au = scanAudio(audioDir);
        if(au!=null){
            genElement = doc.getElementById("audio");
            genElement.empty();
            genElement.append(au);
            flag4 = true;
        }
        boolean flag5 = false;
        String vi = scanVideo(videoDir);
        if(vi!=null){
            genElement = doc.getElementById("video");
            genElement.empty();
            genElement.append(vi);
            flag5 = true;
        }
        Element programDiv = doc.getElementById("program");
        programDiv.empty();
        Elements spans = doc.select("span.category");
        for (Element span : spans) {
            if (span.text().startsWith("_")) {
                Element nextUl = span.nextElementSibling();
                if (nextUl != null && nextUl.tagName().equals("ul")) {
                    programDiv.appendChild(span.clone());
                    programDiv.appendChild(nextUl.clone());
                    span.remove();
                    nextUl.remove();
                }
            }
        }
        Files.write(sideHtml, doc.html().getBytes());

        FileWriter writer = new FileWriter(String.valueOf(dataJs));
        writer.write("var data = new Array(");
        for (int i = 0; i < volume.size(); i++) {
            if (i != 0) {
                writer.write(",");
            }
            writer.write("`" + volume.get(i) + "`");
        }
        if (flag) {
            for (int i = 0; i < bookList.size(); i++) {
                 writer.write(",`" + bookList.get(i) + "`");
            }
        }
        if (flag2) {
            for (int i = 0; i < imageList.size(); i++) {
                writer.write(",`" + imageList.get(i) + "`");
            }
        }
        if (flag4) {
            for (int i = 0; i < audioList.size(); i++) {
                writer.write(",`" + audioList.get(i) + "`");
            }
        }
        if (flag5) {
            for (int i = 0; i < videoList.size(); i++) {
                writer.write(",`" + videoList.get(i) + "`");
            }
        }
        writer.write(");");
        writer.close();

        Files.write(wallpaperJS, generateJSArray(wallpaperDir).getBytes());
    }

    private static String scanBook(Path sourceDir) {
        File directory = new File(String.valueOf(sourceDir));
        if (directory.exists() && directory.isDirectory()) {
            File[] subFiles = directory.listFiles();
            if (subFiles != null) {
                StringBuilder htmlBuilder = new StringBuilder();
                StringBuilder unclassifiedFiles = new StringBuilder();

                for (File file : subFiles) {
                    if (file.isDirectory()) {
                        String categoryName = file.getName();
                        String uniqueId2 = generateUniqueId();
                        htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                .append(uniqueId2)
                                .append("')\">")
                                .append(categoryName)
                                .append("</span>\n");
                        htmlBuilder.append("<ul id=\"").append(uniqueId2).append("\" class=\"hidden\">\n");
                        File[] subFilesInDir = file.listFiles();
                        if (subFilesInDir != null) {
                            StringBuilder unclassifiedFiles2 = new StringBuilder();
                            for (File subFile : subFilesInDir) {
                                if (subFile.isDirectory()) {
                                    String categoryName2 = subFile.getName();
                                    String uniqueId = generateUniqueId();
                                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                            .append(uniqueId)
                                            .append("')\">")
                                            //.append(categoryName2)
                                            .append(StringEscapeUtils.escapeHtml4(categoryName2))
                                            .append("</span>\n");
                                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                                    File[] subFilesInDir2 = subFile.listFiles();
                                    if (subFilesInDir2 != null) {
                                        for (File subFile2 : subFilesInDir2) {
                                            if (!subFile2.isDirectory() && subFile2.getName().toLowerCase().endsWith(".pdf")) {
                                                String fileName = subFile2.getName();
                                                String link = "../book/" + categoryName + "/" + categoryName2 + "/" + fileName;
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\" target=\"content\">")
                                                        .append(fileName)
                                                        .append("</a></li>\n");
                                                bookList.add("");
                                                bookList.add("");
                                                bookList.add(link);
                                                bookList.add("pdf");
                                            } else if (!subFile2.isDirectory() && subFile2.getName().endsWith(".html")) {
                                                String fileName = subFile2.getName();
                                                String link = "../book/" + categoryName + "/" + categoryName2 + "/" + fileName;
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                String escapedFileName = StringEscapeUtils.escapeHtml4(fileName.replaceAll(".html", ".txt"));

                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\">").append(escapedFileName)
                                                        .append("</a></li>\n");
                                                bookList.add("");
                                                bookList.add("");
                                                bookList.add(link);
                                                bookList.add("txt");
                                            } else if (!subFile2.isDirectory() && subFile2.getName().endsWith(".epub")) {
                                                String fileName = subFile2.getName();
                                                String link = "../book/" + categoryName + "/" + categoryName2 + "/" + fileName;
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\" target=\"content\">")
                                                        .append(fileName)
                                                        .append("</a></li>\n");
                                                bookList.add("");
                                                bookList.add("");
                                                bookList.add(link);
                                                bookList.add("epub");
                                            }
                                        }
                                    }
                                    htmlBuilder.append("</ul>\n");
                                } else if (!subFile.isDirectory() && subFile.getName().toLowerCase().endsWith(".pdf")) {
                                    String fileName = subFile.getName();
                                    String link = "../book/" + categoryName + "/" + fileName;
                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\" target=\"content\">")
                                            .append(fileName)
                                            .append("</a></li>\n");
                                    bookList.add("");
                                    bookList.add("");
                                    bookList.add(link);
                                    bookList.add("pdf");
                                } else if (!subFile.isDirectory() && subFile.getName().endsWith(".html")) {
                                    String fileName = subFile.getName();
                                    String link = "../book/" + categoryName + "/" + fileName;

                                    // ✅ 处理 HTML 特殊字符
                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    String escapedFileName = StringEscapeUtils.escapeHtml4(fileName.replaceAll(".html", ".txt"));

                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\">").append(escapedFileName)
                                            .append("</a></li>\n");
                                    bookList.add("");
                                    bookList.add("");
                                    bookList.add(link);
                                    bookList.add("txt");
                                } else if (!subFile.isDirectory() && subFile.getName().toLowerCase().endsWith(".epub")) {
                                    String fileName = subFile.getName();
                                    String link = "../book/" + categoryName + "/" + fileName;
                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\" target=\"content\">")
                                            .append(fileName)
                                            .append("</a></li>\n");
                                    bookList.add("");
                                    bookList.add("");
                                    bookList.add(link);
                                    bookList.add("epub");
                                }
                            }

                            if (unclassifiedFiles2.length() > 0) {
                                htmlBuilder.append(unclassifiedFiles2);
                            }
                        }
                        htmlBuilder.append("</ul>\n");
                    } else if (!file.isDirectory() && file.getName().toLowerCase().endsWith(".pdf")) {
                        String fileName = file.getName();
                        String link = "../book/" + fileName;
                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\" target=\"content\">")
                                .append(fileName)
                                .append("</a></li>\n");
                        bookList.add("");
                        bookList.add("");
                        bookList.add(link);
                        bookList.add("pdf");
                    } else if (!file.isDirectory() && file.getName().endsWith(".html")) {
                        String fileName = file.getName();
                        String link = "../book/" + fileName;

                        // ✅ 处理 HTML 特殊字符
                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        String escapedFileName = StringEscapeUtils.escapeHtml4(fileName.replaceAll(".html", ".txt"));

                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\">").append(escapedFileName)
                                .append("</a></li>\n");
                        bookList.add("");
                        bookList.add("");
                        bookList.add(link);
                        bookList.add("txt");
                    } else if (!file.isDirectory() && file.getName().toLowerCase().endsWith(".epub")) {
                        String fileName = file.getName();
                        String link = "../book/" + fileName;
                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\" target=\"content\">")
                                .append(fileName)
                                .append("</a></li>\n");
                        bookList.add("");
                        bookList.add("");
                        bookList.add(link);
                        bookList.add("epub");
                    }
                }

                if (unclassifiedFiles.length() > 0) {
                    String uniqueId = generateUniqueId();
                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('").append(uniqueId).append("')\">未分类</span>\n");
                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                    htmlBuilder.append(unclassifiedFiles);
                    htmlBuilder.append("</ul>\n");
                }

                return String.valueOf(htmlBuilder);
            }
        }
        return null;
    }

    private static String scanImage(Path sourceDir) throws ImageProcessingException, IOException {
        File directory = new File(String.valueOf(sourceDir));
        if (directory.exists() && directory.isDirectory()) {
            File[] subFiles = directory.listFiles();
            if (subFiles != null) {
                StringBuilder htmlBuilder = new StringBuilder();
                StringBuilder unclassifiedFiles = new StringBuilder();

                for (File file : subFiles) {
                    if (file.isDirectory()) {
                        String categoryName = file.getName();
                        String uniqueId2 = generateUniqueId();
                        htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                .append(uniqueId2)
                                .append("')\">")
                                .append(categoryName)
                                .append("</span>\n");
                        htmlBuilder.append("<ul id=\"").append(uniqueId2).append("\" class=\"hidden\">\n");
                        File[] subFilesInDir = file.listFiles();
                        if (subFilesInDir != null) {
                            StringBuilder unclassifiedFiles2 = new StringBuilder();
                            for (File subFile : subFilesInDir) {
                                if (subFile.isDirectory()) {
                                    String categoryName2 = subFile.getName();
                                    String uniqueId = generateUniqueId();
                                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                            .append(uniqueId)
                                            .append("')\">")
                                            .append(categoryName2)
                                            .append("</span>\n");
                                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                                    File[] subFilesInDir2 = subFile.listFiles();
                                    if (subFilesInDir2 != null) {
                                        for (File subFile2 : subFilesInDir2) {
                                            if (!subFile2.isDirectory() && (
                                                    subFile2.getName().toLowerCase().endsWith(".jpg") ||
                                                            subFile2.getName().toLowerCase().endsWith(".jpeg") ||
                                                            subFile2.getName().toLowerCase().endsWith(".png") ||
                                                            subFile2.getName().toLowerCase().endsWith(".webp") ||
                                                            subFile2.getName().toLowerCase().endsWith(".gif"))) {
                                                String fileName = subFile2.getName();
                                                String link = "../gallery/" + categoryName + "/" + categoryName2 + "/" + fileName;
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\">")
                                                        .append(fileName)
                                                        .append("</a></li>\n");
                                                imageList.add(fileName);
                                                imageList.add(getImageComment(subFile2));
                                                imageList.add(link);
                                                imageList.add("image");
                                            }
                                        }
                                    }
                                    htmlBuilder.append("</ul>\n");
                                } else if (!subFile.isDirectory() && (
                                        subFile.getName().toLowerCase().endsWith(".jpg") ||
                                                subFile.getName().toLowerCase().endsWith(".jpeg") ||
                                                subFile.getName().toLowerCase().endsWith(".png") ||
                                                subFile.getName().toLowerCase().endsWith(".webp") ||
                                                subFile.getName().toLowerCase().endsWith(".gif"))) {
                                    String fileName = subFile.getName();
                                    String link = "../gallery/" + categoryName + "/" + fileName;
                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\">")
                                            .append(fileName)
                                            .append("</a></li>\n");
                                    imageList.add(fileName);
                                    imageList.add(getImageComment(subFile));
                                    imageList.add(link);
                                    imageList.add("image");
                                }
                            }

                            if (unclassifiedFiles2.length() > 0) {
                                htmlBuilder.append(unclassifiedFiles2);
                            }
                        }
                        htmlBuilder.append("</ul>\n");
                    } else if (!file.isDirectory() && (file.getName().toLowerCase().endsWith(".jpg") ||
                            file.getName().toLowerCase().endsWith(".jpeg") ||
                            file.getName().toLowerCase().endsWith(".png") ||
                            file.getName().toLowerCase().endsWith(".webp") ||
                            file.getName().toLowerCase().endsWith(".gif"))) {
                        String fileName = file.getName();
                        String link = "../gallery/" + fileName;
                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\">")
                                .append(fileName)
                                .append("</a></li>\n");
                        imageList.add(fileName);
                        imageList.add(getImageComment(file));
                        imageList.add(link);
                        imageList.add("image");
                    }
                }

                if (unclassifiedFiles.length() > 0) {
                    String uniqueId = generateUniqueId();
                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('").append(uniqueId).append("')\">未分类</span>\n");
                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                    htmlBuilder.append(unclassifiedFiles);
                    htmlBuilder.append("</ul>\n");
                }

                return String.valueOf(htmlBuilder);
            }
        }
        return null;
    }

    public static String getImageComment(File file) throws ImageProcessingException, IOException {
        imageMetadata = ImageMetadataReader.readMetadata(file);
        for (Directory directory : imageMetadata.getDirectories()) {
            for (Tag tag : directory.getTags()) {
                if (directory instanceof ExifIFD0Directory) {
                    if (tag.getTagName().equals("Windows XP Comment")) {
                        return tag.getDescription();
                    }
                }
            }
        }
        return null;
    }

    private static String scanAudio(Path sourceDir) {
        File directory = new File(String.valueOf(sourceDir));
        if (directory.exists() && directory.isDirectory()) {
            File[] subFiles = directory.listFiles();
            if (subFiles != null) {
                StringBuilder htmlBuilder = new StringBuilder();
                StringBuilder unclassifiedFiles = new StringBuilder();

                for (File file : subFiles) {
                    if (file.isDirectory()) {
                        String categoryName = file.getName();
                        String uniqueId2 = generateUniqueId();
                        htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                .append(uniqueId2)
                                .append("')\">")
                                .append(StringEscapeUtils.escapeHtml4(categoryName))
                                .append("</span>\n");
                        htmlBuilder.append("<ul id=\"").append(uniqueId2).append("\" class=\"hidden\">\n");
                        File[] subFilesInDir = file.listFiles();
                        if (subFilesInDir != null) {
                            StringBuilder unclassifiedFiles2 = new StringBuilder();
                            for (File subFile : subFilesInDir) {
                                if (subFile.isDirectory()) {
                                    String categoryName2 = subFile.getName();
                                    String uniqueId = generateUniqueId();
                                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                            .append(uniqueId)
                                            .append("')\">")
                                            .append(StringEscapeUtils.escapeHtml4(categoryName2))
                                            .append("</span>\n");
                                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                                    File[] subFilesInDir2 = subFile.listFiles();
                                    if (subFilesInDir2 != null) {
                                        for (File subFile2 : subFilesInDir2) {
                                            if (!subFile2.isDirectory() && (subFile2.getName().endsWith(".mp3") || subFile2.getName().endsWith(".mav"))) {
                                                String fileName = subFile2.getName();
                                                String link = "audio/" + categoryName + "/" + categoryName2 + "/" + fileName;

                                                // ✅ 确保 HTML 解析不会出错（使用双引号 & 转义）
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\">").append(escapedFileName)
                                                        .append("</a></li>\n");
                                                audioList.add("");
                                                audioList.add("");
                                                audioList.add(link);
                                                audioList.add("audio");
                                            }
                                        }
                                    }
                                    htmlBuilder.append("</ul>\n");
                                } else if (!subFile.isDirectory() && (subFile.getName().endsWith(".mp3") || subFile.getName().endsWith(".mav"))) {
                                    String fileName = subFile.getName();
                                    String link = "audio/" + categoryName + "/" + fileName;

                                    // ✅ 处理 HTML 特殊字符
                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\">").append(escapedFileName)
                                            .append("</a></li>\n");
                                    audioList.add("");
                                    audioList.add("");
                                    audioList.add(link);
                                    audioList.add("audio");
                                }
                            }

                            if (unclassifiedFiles2.length() > 0) {
                                htmlBuilder.append(unclassifiedFiles2);
                            }
                        }
                        htmlBuilder.append("</ul>\n");
                    } else if (!file.isDirectory() && (file.getName().endsWith(".mp3") || file.getName().endsWith(".mav"))) {
                        String fileName = file.getName();
                        String link = "audio/" + fileName;

                        // ✅ 确保 HTML 解析不会出错
                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\">").append(escapedFileName)
                                .append("</a></li>\n");
                        audioList.add("");
                        audioList.add("");
                        audioList.add(link);
                        audioList.add("audio");
                    }
                }

                if (unclassifiedFiles.length() > 0) {
                    String uniqueId = generateUniqueId();
                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('").append(uniqueId).append("')\">未分类</span>\n");
                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                    htmlBuilder.append(unclassifiedFiles);
                    htmlBuilder.append("</ul>\n");
                }

                return htmlBuilder.toString();
            }
        }
        return null;
    }

    private static String scanVideo(Path sourceDir) {
        File directory = new File(String.valueOf(sourceDir));
        if (directory.exists() && directory.isDirectory()) {
            File[] subFiles = directory.listFiles();
            if (subFiles != null) {
                StringBuilder htmlBuilder = new StringBuilder();
                StringBuilder unclassifiedFiles = new StringBuilder();

                for (File file : subFiles) {
                    if (file.isDirectory()) {
                        String categoryName = file.getName();
                        String uniqueId2 = generateUniqueId();
                        htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                .append(uniqueId2)
                                .append("')\">")
                                .append(categoryName)
                                .append("</span>\n");
                        htmlBuilder.append("<ul id=\"").append(uniqueId2).append("\" class=\"hidden\">\n");
                        File[] subFilesInDir = file.listFiles();
                        if (subFilesInDir != null) {
                            StringBuilder unclassifiedFiles2 = new StringBuilder();
                            for (File subFile : subFilesInDir) {
                                if (subFile.isDirectory()) {
                                    String categoryName2 = subFile.getName();
                                    String uniqueId = generateUniqueId();
                                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('")
                                            .append(uniqueId)
                                            .append("')\">")
                                            .append(categoryName2)
                                            .append("</span>\n");
                                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                                    File[] subFilesInDir2 = subFile.listFiles();
                                    if (subFilesInDir2 != null) {
                                        for (File subFile2 : subFilesInDir2) {
                                            if (!subFile2.isDirectory() && isVideoFile(subFile2.getName())) {
                                                String fileName = subFile2.getName();
                                                String link = "../video/" + categoryName + "/" + categoryName2 + "/" + fileName;

                                                // 转义特殊字符，确保HTML解析正确
                                                String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                                String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                                                htmlBuilder.append("<li><a data-path=\"").append(escapedLink)
                                                        .append("\">").append(escapedFileName)
                                                        .append("</a></li>\n");
                                                videoList.add("");
                                                videoList.add("");
                                                videoList.add(link);
                                                videoList.add("video");
                                            }
                                        }
                                    }
                                    htmlBuilder.append("</ul>\n");
                                } else if (!subFile.isDirectory() && isVideoFile(subFile.getName())) {
                                    String fileName = subFile.getName();
                                    String link = "../video/" + categoryName + "/" + fileName;

                                    String escapedLink = StringEscapeUtils.escapeHtml4(link);
                                    String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                                    unclassifiedFiles2.append("<li><a data-path=\"").append(escapedLink)
                                            .append("\">").append(escapedFileName)
                                            .append("</a></li>\n");
                                    videoList.add("");
                                    videoList.add("");
                                    videoList.add(link);
                                    videoList.add("video");
                                }
                            }

                            if (unclassifiedFiles2.length() > 0) {
                                htmlBuilder.append(unclassifiedFiles2);
                            }
                        }
                        htmlBuilder.append("</ul>\n");
                    } else if (!file.isDirectory() && isVideoFile(file.getName())) {
                        String fileName = file.getName();
                        String link = "../video/" + fileName;

                        String escapedLink = StringEscapeUtils.escapeHtml4(link);
                        String escapedFileName = StringEscapeUtils.escapeHtml4(fileName);

                        unclassifiedFiles.append("<li><a data-path=\"").append(escapedLink)
                                .append("\">").append(escapedFileName)
                                .append("</a></li>\n");
                        videoList.add("");
                        videoList.add("");
                        videoList.add(link);
                        videoList.add("video");
                    }
                }

                if (unclassifiedFiles.length() > 0) {
                    String uniqueId = generateUniqueId();
                    htmlBuilder.append("\n<span class=\"category inactive\" onclick=\"toggle('").append(uniqueId).append("')\">未分类</span>\n");
                    htmlBuilder.append("<ul id=\"").append(uniqueId).append("\" class=\"hidden\">\n");
                    htmlBuilder.append(unclassifiedFiles);
                    htmlBuilder.append("</ul>\n");
                }

                return htmlBuilder.toString();
            }
        }
        return null;
    }

    public static boolean isVideoFile(String fileName) {
        String[] s = { ".mp4", ".avi", ".mov", ".wmv", ".mkv", ".flv", ".webm", ".ogg", ".ogv", ".3gp" };
        for (String ext : s) {
            if (fileName.toLowerCase().endsWith(ext)) {
                return true;
            }
        }
        return false;
    }

    private static String generateJSArray(Path dir) throws IOException {
        // 创建一个StringBuilder来构建JS数组
        StringBuilder sb = new StringBuilder();
        sb.append("var wallpapers = new Array(\n");

        // 递归遍历目录和子目录
        try (Stream<Path> stream = Files.walk(dir)) {
            List<String> fileNames = stream
                    .filter(Files::isRegularFile) // 过滤出文件
                    .filter(file -> {
                        String fileName = file.getFileName().toString().toLowerCase();
                        return fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png") || fileName.endsWith(".gif") || fileName.endsWith(".webp");
                    })
                    .map(file -> dir.relativize(file).toString()) // 获取相对路径
                    .collect(Collectors.toList());

            boolean first = true; // 标志变量来处理最后一个逗号

            for (String fileName : fileNames) {
                if (!first) {
                    sb.append(",\n");
                }
                first = false;
                sb.append("\"").append(dir.toString().replace("\\", "/")).append("/").append(fileName.replace("\\", "/")).append("\"");
            }
        }

        sb.append("\n);");
        return sb.toString();
    }

    // 按data-stamp升序排序
    private static List<String> sortArticlesByDataStamp(List<String> articles) {
        articles.sort((a, b) -> {
            String stampA = extractDataStamp(a);
            String stampB = extractDataStamp(b);
            return stampB.compareTo(stampA);
        });
        return articles;
    }

    // 提取data-stamp的值
    private static String extractDataStamp(String article) {
        Pattern pattern = Pattern.compile("data-stamp=\"(\\d+)\"");
        Matcher matcher = pattern.matcher(article);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return ""; // 如果没有找到匹配，返回空字符串
    }

    //txt头部追加内容, 改后缀
    public static void txtToHtml(Path sourceDir, Path headerFilePath) {
        File directory = sourceDir.toFile();
        if (directory.exists() && directory.isDirectory()) {
            String headerContent = readHeaderFile(headerFilePath);
            if (headerContent == null) {
                throw new Err("Failed to read the header file.");
            }

            File[] subFiles = directory.listFiles();
            if (subFiles != null) {
                processFiles(subFiles, headerContent);
            }
        }
    }

    private static void processFiles(File[] files, String headerContent) {
        for (File file : files) {
            if (file.isDirectory()) {
                processFiles(file.listFiles(), headerContent); // 递归处理子目录
            } else if (file.isFile() && file.getName().toLowerCase().endsWith(".txt")) {
                convertToHtml(file, headerContent);
            }
        }
    }

    private static void convertToHtml(File txtFile, String headerContent) {
        Path txtFilePath = txtFile.toPath();
        Path htmlFilePath = txtFilePath.resolveSibling(txtFile.getName().replaceAll("(?i)\\.txt$", ".html"));

        Charset detectedCharset = detectFileEncoding(txtFile);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(txtFile), detectedCharset));
             BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(htmlFilePath.toFile()), StandardCharsets.UTF_8))) {

            writer.write("<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n");
            writer.write(headerContent + "\n"); // 插入 JavaScript 代码
            writer.write("</head>\n<body>\n");

            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(removeBOM(line) + "\n");
            }

            writer.write("</body>\n</html>"); // 关闭 HTML 结构

        } catch (Exception e) {
            throw new Err("Error converting file: " + txtFile.getName());
        }

        // 删除原 .txt 文件
        if (!txtFile.delete()) {
            throw new Err("Failed to delete: " + txtFile.getName());
        }
    }

    private static String removeBOM(String str) {
        if (str.startsWith("\uFEFF")) {
            return str.substring(1);
        }
        return str;
    }

    public static Charset detectFileEncoding(File file) {
        byte[] buf = new byte[4096];
        try (FileInputStream fis = new FileInputStream(file)) {
            UniversalDetector detector = new UniversalDetector(null);
            int nRead;
            while ((nRead = fis.read(buf)) > 0 && !detector.isDone()) {
                detector.handleData(buf, 0, nRead);
            }
            detector.dataEnd();
            String encoding = detector.getDetectedCharset();
            detector.reset();

            if (encoding != null) {
                return Charset.forName(encoding);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return StandardCharsets.UTF_8; // 默认回退 UTF-8
    }

    private static String readHeaderFile(Path headerFilePath) {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(headerFilePath.toFile()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        } catch (Exception e) {
            throw new Err("Error reading header file: " + headerFilePath);
        }
        return content.toString();
    }
}

class ChineseStringComparator implements Comparator<String> {
    //Collator.getInstance(Locale.CHINESE) 是一个相对昂贵的操作。
    //如果在循环中频繁调用它，会导致不必要的性能开销。通过将其声明为一个变量，可以避免重复创建 Collator 实例，从而提升性能。
    private final Collator collator;
    public ChineseStringComparator() {
        this.collator = Collator.getInstance(Locale.CHINESE);
    }
    @Override
    public int compare(String s1, String s2) {
        return collator.compare(s1, s2);
    }
}