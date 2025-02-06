import com.luciad.imageio.webp.WebPImageWriterSpi;
import com.luciad.imageio.webp.WebPWriteParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import javax.imageio.spi.ImageWriterSpi;
import java.awt.*;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.image.BufferedImage;
import java.io.*;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;

public class Webp {
    private static final Logger logger = LoggerFactory.getLogger(Webp.class);

    public static void main(String[] args) {
        try {
            func();
        } catch (Exception e) {
            logger.error(e.getMessage(),e);
        }
    }
    public static void func() throws Exception{
        Properties props = new Properties();
        props.load(new FileInputStream("config.properties"));

        String webpTargetDir = props.getProperty("webpTargetDir");
        String webpOutputDir = props.getProperty("webpOutputDir");
        String webpQuality = props.getProperty("webpQuality");

        String historyPath = webpTargetDir + "\\history\\";
        File historyFolder = new File(historyPath);
        if (!historyFolder.exists()) {
            historyFolder.mkdirs();
        }

        File[] imageFiles = new File(webpTargetDir)
                .listFiles((dir, name) ->
                        name.toLowerCase().endsWith(".jpg") ||
                                name.toLowerCase().endsWith(".jpeg") ||
                                name.toLowerCase().endsWith(".png"));
        if (imageFiles.length == 0) {
            throw new Err("源目录中没有图片文件(.jpg|.jpeg|.png)");
        }

        Long no = Long.parseLong(new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
        List<String> records = new ArrayList<>();
        for (File imageFile : imageFiles) {
            no++;
            String newFileName = no + ".webp";
            BufferedImage image = ImageIO.read(imageFile);
            ImageWriterSpi spi = new WebPImageWriterSpi();
            ImageWriter writer = spi.createWriterInstance();
            WebPWriteParam writeParam = new WebPWriteParam(writer.getLocale());
            writeParam.setCompressionQuality(Float.parseFloat(webpQuality));
            ImageIO.write(image, "webp", new File(webpOutputDir +"\\"+ newFileName));
            imageFile.renameTo(new File(historyPath + imageFile.getName()));
            records.add(newFileName);
        }

        StringBuilder stb = new StringBuilder();
        for (String s : records){
            stb.append(s).append("\n");
        }
        Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
        Transferable transferableText = new StringSelection(stb.toString());
        clipboard.setContents(transferableText, null);
    }
}
