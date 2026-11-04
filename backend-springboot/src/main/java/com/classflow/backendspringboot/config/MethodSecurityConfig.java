package com.classflow.backendspringboot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/** Enables method-level authorization throughout the ClassFlow backend. */
@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig {
}
