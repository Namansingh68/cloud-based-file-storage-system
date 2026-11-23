package com.project.fileserver.config;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Bean
    public static BeanPostProcessor dataSourcePropertiesPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSourceProperties props) {
                    String rawUrl = props.getUrl();
                    if (rawUrl != null) {
                        try {
                            String normalized = rawUrl.startsWith("jdbc:") ? rawUrl.substring(5) : rawUrl;
                            if (normalized.startsWith("postgresql://") || normalized.startsWith("postgres://")) {
                                URI uri = URI.create(normalized);
                                String userInfo = uri.getUserInfo();
                                if (userInfo != null && userInfo.contains(":")) {
                                    String[] parts = userInfo.split(":", 2);
                                    if (props.getUsername() == null || props.getUsername().isBlank() || "postgres".equals(props.getUsername())) {
                                        props.setUsername(parts[0]);
                                    }
                                    if (props.getPassword() == null || props.getPassword().isBlank() || "postgres".equals(props.getPassword())) {
                                        props.setPassword(parts[1]);
                                    }
                                }
                                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                                String path = uri.getPath() != null && !uri.getPath().isBlank() ? uri.getPath() : "/postgres";
                                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "?sslmode=require";
                                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + path + (uri.getQuery() != null ? query : "?sslmode=require");
                                props.setUrl(jdbcUrl);
                            }
                        } catch (Exception ignored) {
                            if (rawUrl.startsWith("postgresql://")) {
                                props.setUrl("jdbc:" + rawUrl);
                            }
                        }
                    }
                }
                return bean;
            }
        };
    }
}
