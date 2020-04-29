package com.erp.shiro.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Created by zmj
 * On 2020/3/3.
 *
 * @author 0.0.0
 */
@Slf4j
@Controller
@RequestMapping("view")
public class ViewController {

    /**
     * 打开templates页面
     *
     * @param path 页面路径（可选）
     * @param name html文件名
     * @return 返回html
     */
    @RequestMapping
    public String view(@RequestParam(required = false) String path, @RequestParam String name) {
        return StringUtils.isEmpty(path) ? name : (path + name);
    }
}
