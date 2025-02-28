import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.text.SimpleDateFormat;
import java.util.*;

import com.luciad.imageio.webp.WebPImageWriterSpi;
import com.luciad.imageio.webp.WebPWriteParam;
import org.json.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import javax.imageio.spi.ImageWriterSpi;

public class Keep {
    private static int timeOffset = 0;
    private static Set<String> noteImageFiles = new HashSet<>();
    private static final Logger logger = LoggerFactory.getLogger(Keep.class);

    public static void main(String[] args) {
        try {
            func(args[0],args[1]);
        } catch (Exception e) {
            logger.error(e.getMessage(),e);
        }
    }

    private static void func(String folderPath, String label) throws IOException {
        String outputFile = folderPath + File.separator + "____notes____.txt";

        File folder = new File(folderPath);
        if (!folder.exists() || !folder.isDirectory()) {
            throw new Err("目录不存在: " + folderPath);
        }

        List<File> jsonFiles = Arrays.asList(Objects.requireNonNull(folder.listFiles((dir, name) -> name.endsWith(".json"))));
        List<NoteData> notes = new ArrayList<>();

        for (File jsonFile : jsonFiles) {
            processJsonFile(jsonFile, notes, folderPath,label);
        }

        notes.sort(Comparator.comparingLong(note -> note.createdTimestamp));

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {
            for (NoteData note : notes) {
                writer.write(note.toString());
            }
        } catch (IOException e) {
            throw new Err("写入文件失败: " + e.getMessage());
        }

        toWebp(folderPath);
    }

    private static void processJsonFile(File file, List<NoteData> notes, String folderPath, String label) {
        try {
            String content = new String(Files.readAllBytes(file.toPath()));
            JSONObject json = new JSONObject(content);

            if (!json.optBoolean("isArchived", false) || json.optBoolean("isTrashed", false)) {
                return;
            }

            JSONArray labelsArray = json.optJSONArray("labels");
            if (labelsArray != null) {
                boolean hasAllowedLabel = false;
                for (int i = 0; i < labelsArray.length(); i++) {
                    JSONObject labelObj = labelsArray.getJSONObject(i);
                    if (labelObj.optString("name", "").equals(label)) {
                        hasAllowedLabel = true;
                        break;
                    }
                }
                if (!hasAllowedLabel) {
                    return; // 如果没有包含指定标签，则跳过
                }
            } else {
                return; // 没有标签则跳过
            }

            String title = json.optString("title", "无标题");
            String text = json.optString("textContent", "").trim();
            long createdTimestamp = json.optLong("createdTimestampUsec", 0L) / 1000;

            JSONArray attachments = json.optJSONArray("attachments");
            List<String> newImageNames = new ArrayList<>();
            if (attachments != null) {
                for (int i = 0; i < attachments.length(); i++) {
                    JSONObject attachment = attachments.getJSONObject(i);
                    if (attachment.optString("mimetype", "").startsWith("image")) {
                        String oldImageName = attachment.optString("filePath", "未知图片");
                        String[] newImageName = renameImageFile(folderPath, oldImageName);
                        newImageNames.add(newImageName[0] + ".webp");
                        noteImageFiles.add(newImageName[0] + newImageName[1]);
                    }
                }
            }

            notes.add(new NoteData(title, text, newImageNames, createdTimestamp));
        } catch (Exception e) {
            throw new Err("解析 JSON 失败: " + file.getName() + " - " + e.getMessage());
        }
    }

    private static String[] renameImageFile(String folderPath, String oldImageName) {
        File oldFile = new File(folderPath, oldImageName);
        if (!oldFile.exists()) {
            throw new Err("图片文件不存在: " + oldImageName);
        }

        long currentTimeMillis = System.currentTimeMillis();
        Date newDate = new Date(currentTimeMillis + (timeOffset * 1000)); // 加 1 秒
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        String newBaseName = sdf.format(newDate);
        timeOffset++;

        String extension = "";
        int dotIndex = oldImageName.lastIndexOf('.');
        if (dotIndex != -1) {
            extension = oldImageName.substring(dotIndex);
        }

        String newImageName = newBaseName + extension;
        File newFile = new File(folderPath, newImageName);

        if (oldFile.renameTo(newFile)) {
            return new String[]{newBaseName, extension};
        } else {
            throw new Err("重命名失败");
        }
    }

    private static void appendNote(StringBuilder result, String title, List<String> images, String text) {
        result.append("<h1>").append(title).append("</h1>\n");

        for (String img : images) {
            result.append(img).append("\n");
        }

        result.append(text).append("\n\n\n");
    }

    private static void toWebp(String folderPath) throws IOException {
        Properties props = new Properties();
        props.load(new FileInputStream("config.properties"));
        String webpOutputDir = props.getProperty("webpOutputDir");
        String webpQuality = props.getProperty("webpQuality");

        for (String imageName : noteImageFiles) {
            File imageFile = new File(folderPath, imageName);

            //if(true) {throw new Err("------test------: " + imageFile);}

            if (!imageFile.exists()) {
                continue;
            }

            BufferedImage image = ImageIO.read(imageFile);
            ImageWriterSpi spi = new WebPImageWriterSpi();
            ImageWriter writer = spi.createWriterInstance();
            WebPWriteParam writeParam = new WebPWriteParam(writer.getLocale());
            writeParam.setCompressionQuality(Float.parseFloat(webpQuality));

            String originalName = imageFile.getName().replaceAll("\\.[^.]+$", "");
            File outputFile = new File(webpOutputDir, originalName + ".webp");

            ImageIO.write(image, "webp", outputFile);
        }
    }

    private static class NoteData {
        String title;
        String text;
        List<String> images;
        long createdTimestamp;

        public NoteData(String title, String text, List<String> images, long createdTimestamp) {
            this.title = title;
            this.text = text;
            this.images = images;
            this.createdTimestamp = createdTimestamp;
        }

        @Override
        public String toString() {
            StringBuilder result = new StringBuilder();
            result.append("<h1>").append(title).append("</h1>\n");
            for (String img : images) {
                result.append(img).append("\n");
            }
            result.append(text).append("\n\n\n");
            return result.toString();
        }
    }
}