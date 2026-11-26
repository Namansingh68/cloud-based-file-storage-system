package com.project.fileserver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:drive_e2e;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false",
        "app.storage.type=database"
})
public class DriveEndToEndIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void fullDriveLifecycle_uploadFolderContentsShareTrashActivity_shouldNeverThrowLazy500() throws Exception {
        String email = "e2e-user@example.com";
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User(email, passwordEncoder.encode("secret123"), "E2E User");
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        // 1. Sign in to obtain JWT
        MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginRes.getResponse().getContentAsString());
        String jwt = loginJson.get("token").asText();
        String authHeader = "Bearer " + jwt;

        // 2. Empty root contents check
        mockMvc.perform(get("/api/folders/contents").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folders", hasSize(0)))
                .andExpect(jsonPath("$.files", hasSize(0)));

        // 3. Create root folder + nested child folder
        MvcResult rootFolderRes = mockMvc.perform(post("/api/folders")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Docs\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Docs"))
                .andReturn();
        long rootFolderId = objectMapper.readTree(rootFolderRes.getResponse().getContentAsString()).get("id").asLong();

        MvcResult subFolderRes = mockMvc.perform(post("/api/folders")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sem5\",\"parentId\":" + rootFolderId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sem5"))
                .andReturn();
        long subFolderId = objectMapper.readTree(subFolderRes.getResponse().getContentAsString()).get("id").asLong();

        // 4. Upload file to root AND into subfolder
        MockMultipartFile sampleFile = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "CloudVault integration test content".getBytes(StandardCharsets.UTF_8)
        );
        MvcResult uploadRes = mockMvc.perform(multipart("/api/files/upload")
                        .file(sampleFile)
                        .param("folderId", String.valueOf(subFolderId))
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("notes.txt"))
                .andReturn();
        long fileId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("id").asLong();

        // 5. Fetch root contents and nested subfolder contents (with breadcrumb traversal)
        mockMvc.perform(get("/api/folders/contents").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folders", hasSize(1)))
                .andExpect(jsonPath("$.folders[0].name").value("Docs"));

        mockMvc.perform(get("/api/folders/contents")
                        .param("folderId", String.valueOf(subFolderId))
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.breadcrumbs", hasSize(3)))
                .andExpect(jsonPath("$.files", hasSize(1)))
                .andExpect(jsonPath("$.files[0].name").value("notes.txt"));

        // 6. Preview, Download, Share Link, Activity, Trash, Restore, Stats
        mockMvc.perform(get("/api/files/" + fileId + "/preview").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("inline")));

        MvcResult shareRes = mockMvc.perform(post("/api/share")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fileId\":" + fileId + ",\"permission\":\"VIEWER\",\"expiresInHours\":24}"))
                .andExpect(status().isOk())
                .andReturn();
        String shareToken = objectMapper.readTree(shareRes.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/share/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.file.name").value("notes.txt"));

        mockMvc.perform(delete("/api/files/" + fileId).header("Authorization", authHeader))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/trash").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.files", hasSize(1)));

        mockMvc.perform(post("/api/files/" + fileId + "/restore").header("Authorization", authHeader))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/activity").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(4))));

        mockMvc.perform(get("/api/dashboard/stats").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileCount").value(1));

        // 7. Permanent purge
        mockMvc.perform(delete("/api/files/" + fileId + "/permanent").header("Authorization", authHeader))
                .andExpect(status().isOk());
    }
}
