package com.project.fileserver.controller;

import com.project.fileserver.entity.ActivityLog;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.UserRepository;
import com.project.fileserver.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@Tag(name = "Activity", description = "Audit trail and operation logging (FR-13)")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping
    @Operation(summary = "Get user activity audit trail (FR-13)")
    public ResponseEntity<List<ActivityLog>> getActivities() {
        User user = getAuthenticatedUser();
        List<ActivityLog> activities = activityService.getUserActivities(user);
        return ResponseEntity.ok(activities);
    }
}
