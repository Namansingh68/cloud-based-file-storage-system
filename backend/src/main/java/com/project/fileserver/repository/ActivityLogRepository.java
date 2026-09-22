package com.project.fileserver.repository;

import com.project.fileserver.entity.ActivityLog;
import com.project.fileserver.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findTop50ByUserOrderByTimestampDesc(User user);
}
