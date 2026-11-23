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
                        if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
                            props.setUrl("jdbc:" + url);
                        }
                    }
                    logger.info("DataSource initialized: URL={}, Username={}", props.getUrl(), props.getUsername());
                }
                return bean;
            }
        };
    }
}
