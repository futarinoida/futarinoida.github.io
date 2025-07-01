import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Stamp {
    private static final Logger logger = LoggerFactory.getLogger(Stamp.class);

    public static void main(String[] args) {
        try {
            func(args);
        } catch (Exception e) {
            logger.error("Error occurred", e);
        }
    }

    public static void func(String[] args) throws Exception {
        if (args.length < 1) {
            throw new Err("没有附带文件名");
        }
        String b64 = args[0];
        byte[] decoded = Base64.getDecoder().decode(b64);
        String fileName = new String(decoded, StandardCharsets.UTF_8) + ".html";

        // 获取 JAR 文件所在目录的上一级目录
        File jarFile = new File(Stamp.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        File jarDir = jarFile.getParentFile();  // JAR 所在目录
        File baseDir = jarDir.getParentFile();  // 上一级目录

        // 配置文件路径
        File configFile = new File(baseDir, "config.properties");
        if (!configFile.exists()) {
            throw new Err("配置文件未找到: " + configFile.getAbsolutePath());
        }

        // 加载配置文件
        Properties props = new Properties();
        try (InputStream input = new FileInputStream(configFile)) {
            props.load(input);
        }

        // 获取 htmlDir 并转换为绝对路径
        Path htmlDir = baseDir.toPath().resolve(props.getProperty("htmlDir")).normalize();
        File htmlFile = new File(htmlDir.toFile(), fileName);

        if (!htmlFile.exists()) {
            throw new Err("文件未找到: " + htmlFile.getAbsolutePath());
        }

        // 读取 HTML 文件
        String content = new String(Files.readAllBytes(htmlFile.toPath()), "UTF-8");
        Pattern pattern = Pattern.compile("<span id=\"anchor\">(\\d{14})-(.*?)</span>");
        Matcher matcher = pattern.matcher(content);

        // 替换时间戳
        if (matcher.find()) {
            String newTimestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
            String replacement = "<span id=\"anchor\">" + newTimestamp + "-" + matcher.group(2) + "</span>";
            content = matcher.replaceFirst(replacement);
        } else {
            throw new Err("未找到匹配的 <span id=\"anchor\">");
        }

        // 写回文件
        Files.write(htmlFile.toPath(), content.getBytes("UTF-8"));
    }
}


