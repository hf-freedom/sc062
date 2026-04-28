package com.ad.system.init;

import com.ad.system.store.DataStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private DataStore dataStore;

    @Override
    public void run(String... args) throws Exception {
        dataStore.init();
        System.out.println("基础数据初始化完成");
    }
}
