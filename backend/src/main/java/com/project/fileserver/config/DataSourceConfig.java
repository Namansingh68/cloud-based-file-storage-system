package com.project.fileserver.config;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {

    @Bean
    public BeanPostProcessor dataSourcePropertiesPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSourceProperties props) {
                    String url = props.getUrl();
                    if (url != null && url.startsWith("postgresql://")) {
                        props.setUrl("jdbc:" + url);
                    }
                }
                return bean;
            }
        };
    }
}
