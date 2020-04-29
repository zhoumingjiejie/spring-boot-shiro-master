package com.erp.shiro.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import java.util.List;
import java.util.Map;

/**
 * @author 0.0.0
 * @ProjectName: [wln]
 * @Package: [cn.oz.fom.wln.config.ShiroPermissionProperties]
 * @Description shiros许可属性
 * @Date 2020/3/9 14:23
 */
@Configuration
@PropertySource(value = "classpath:application.yml", encoding = "utf-8")
@ConfigurationProperties(prefix = "permission-config")
@Data
public class ShiroPermissionProperties {
    private List<Map<String, String>> perms;
}
