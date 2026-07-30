package com.mageireio.backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media")
public class FileUploadController {

    // Ο φάκελος όπου θα αποθηκεύονται οι εικόνες
    private final String UPLOAD_DIR = "uploads/";

    public FileUploadController() {
        // Δημιουργία του φακέλου αν δεν υπάρχει
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) directory.mkdirs();
    }

    // 1. Endpoint για το Ανέβασμα (Upload)
    @PostMapping("/upload")
    public Map<String, String> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path path = Paths.get(UPLOAD_DIR + fileName);
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        Map<String, String> response = new HashMap<>();
        response.put("url", "uploads/" + fileName);
        return response;
    }

    // 2. Endpoint για τη Λίστα (Library)
    @GetMapping("/files")
    public List<String> listFiles() {
        File folder = new File(UPLOAD_DIR);
        File[] listOfFiles = folder.listFiles();
        if (listOfFiles == null) return new ArrayList<>();

        return Arrays.stream(listOfFiles)
                .map(File::getName)
                .collect(Collectors.toList());
    }
}