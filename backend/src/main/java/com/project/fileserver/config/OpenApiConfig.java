package com.project.fileserver.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Secure Cloud-Based File Storage and Document Management System API")
                        .description("REST API for CS24300 Project-I (Semester V, BIT Mesra). Covers User Auth, File & Hierarchical Folder Management, RBAC, Shareable Links, and Activity Logging.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("BIT Mesra - Project Team (Ravinder, Utkarsh, Naman)")
                                .email("project-sem5@bitmesra.ac.in")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
