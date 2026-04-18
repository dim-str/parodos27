package com.mageireio.backend.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary( ObjectUtils.asMap(
                "cloud_name", "dm1xwfr0m",
                "api_key", "857299631984821",
                "api_secret", "zlbCtiNcFWzZMBhHyytgawhbe2U"
        ));
    }

    @Service
    public class ImageService {

        @Autowired
        private Cloudinary cloudinary;

        public String uploadImage(MultipartFile file) throws IOException {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return uploadResult.get("url").toString();
        }
    }
}
