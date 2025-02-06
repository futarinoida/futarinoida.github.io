import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Properties;

public class New {
    private static final Logger logger = LoggerFactory.getLogger(New.class);

    public static void main(String[] args) {
        try {
            func(args[0], args[1]);
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
    }

    private static void func(String _title, String _category) throws IOException {
        Properties props = new Properties();
        try (InputStream input = new FileInputStream("config.properties")) {
            props.load(input);
        }

        Path htmlDir = Paths.get(props.getProperty("htmlDir"));
        Path templateHtml = Paths.get(props.getProperty("templateHtml"));

        if (!Files.exists(htmlDir)) {
            throw new Err("ERROR: HTML directory does not exist: " + htmlDir);
        }

        File inputFile = templateHtml.toFile();
        if (!inputFile.exists()) {
            throw new Err("ERROR: Template file not found: " + templateHtml);
        }

        Document doc = Jsoup.parse(inputFile, "UTF-8");

        doc.title(_title);
        Element firstSpan = doc.selectFirst("span");
        if (firstSpan == null) {
            throw new Err("ERROR: No <span> tag found in template.");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        firstSpan.text(timestamp + "-" + _category);

        Path outputFilePath = htmlDir.resolve(_title + ".html");
        try (BufferedWriter writer = Files.newBufferedWriter(outputFilePath)) {
            writer.write(doc.outerHtml());
        }
    }

}
