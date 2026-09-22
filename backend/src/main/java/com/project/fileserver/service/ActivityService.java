package com.project.fileserver.service;

import com.project.fileserver.entity.ActivityLog;
import com.project.fileserver.entity.User;
import com.project.fileserver.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityLogRepository activityRepository;

    public void log(User user, String action, String targetType, Long targetId, String targetName, String details) {
        try {
            ActivityLog log = new ActivityLog(user, action, targetType, targetId, targetName, details);
            activityRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to write activity log: " + e.getMessage());
        }
    }

    public List<ActivityLog> getUserActivities(User user) {
        return activityRepository.findTop50ByUserOrderByTimestampDesc(user);
    }
}
