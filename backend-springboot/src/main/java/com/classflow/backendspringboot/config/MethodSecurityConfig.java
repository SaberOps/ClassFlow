package com.classflow.backendspringboot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables method-level authorization throughout the ClassFlow backend. */
@Configuration
@EnableMethodSecurity
@EnableScheduling
public class MethodSecurityConfig {
}
