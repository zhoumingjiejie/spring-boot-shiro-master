package com.erp.shiro.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import java.util.List;
import java.util.Map;

/**
 * 配置api常量
 *
 * @author 0.0.0
 * @ProjectName: [factory]
 * @Package: [cn.oz.fom.wln.config.WebProperties]
 * @Description 配置api常量
 * @Date 2020/3/23 10:18
 */
@Configuration
@PropertySource(value = "classpath:application.yml")
@ConfigurationProperties(prefix = "web")
@Data
public class WebProperties {
    private List<String> list;

    private Map<String, String> maps;

    private Map<String, List<String>> mapList;

    private List<Map<String, String>> listMap;
}
