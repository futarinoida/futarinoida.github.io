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
            func(args[0]);
        } catch (Exception e) {
            logger.error(e.getMessage(),e);
        }
    }

    public static void func(String folderPath) throws IOException {
        String outputFile = folderPath + File.separator + "____notes____.txt";

        File folder = new File(folderPath);
        if (!folder.exists() || !folder.isDirectory()) {
            throw new Err("目录不存在: " + folderPath);
        }

        List<File> jsonFiles = Arrays.asList(Objects.requireNonNull(folder.listFiles((dir, name) -> name.endsWith(".json"))));
        StringBuilder result = new StringBuilder();

        for (File jsonFile : jsonFiles) {
            processJsonFile(jsonFile, result, folderPath);
        }

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {
            writer.write(result.toString());
        } catch (IOException e) {
            throw new Err("写入文件失败: " + e.getMessage());
        }

        toWebp(folderPath);
    }

    private static void processJsonFile(File file, StringBuilder result, String folderPath) {
        try {
            String content = new String(Files.readAllBytes(file.toPath()));
            JSONObject json = new JSONObject(content);

            if (!json.optBoolean("isArchived", false)) {
                return;
            }

            String title = json.optString("title", "无标题");
            String text = json.optString("textContent", "").trim();

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

            appendNote(result, title, newImageNames, text);
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
}