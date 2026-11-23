package com.project.fileserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Bean
    public static BeanPostProcessor dataSourcePropertiesPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSourceProperties props) {
                    String url = props.getUrl();
                    if (url != null) {
                        // Strip all accidental spaces or line-breaks from copy-pasting in cloud dashboards
                        url = url.trim().replaceAll("\\s+", "");
                        if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
                            url = "jdbc:" + url;
                        }
                        if (url.contains("pooler.supabase.com") && !url.contains("connectTimeout")) {
                            url = url.contains("?") ? url + "&connectTimeout=10&socketTimeout=30" : url + "?sslmode=require&connectTimeout=10&socketTimeout=30";
                        }
                        props.setUrl(url);
                    }
                    if (props.getUsername() != null) {
                        props.setUsername(props.getUsername().trim().replaceAll("\\s+", ""));
                    }
                    logger.info("DataSource initialized successfully: URL={}, Username={}", props.getUrl(), props.getUsername());
                }
                return bean;
            }
        };
    }
}
