package com.ad.system.store;

import com.ad.system.enums.MaterialStatus;
import com.ad.system.enums.PlanStatus;
import com.ad.system.model.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DataStore {

    private final AtomicLong advertiserIdGenerator = new AtomicLong(1);
    private final AtomicLong planIdGenerator = new AtomicLong(1);
    private final AtomicLong materialIdGenerator = new AtomicLong(1);
    private final AtomicLong impressionIdGenerator = new AtomicLong(1);
    private final AtomicLong clickIdGenerator = new AtomicLong(1);
    private final AtomicLong conversionIdGenerator = new AtomicLong(1);
    private final AtomicLong settlementIdGenerator = new AtomicLong(1);
    private final AtomicLong reportIdGenerator = new AtomicLong(1);
    private final AtomicLong adjustmentIdGenerator = new AtomicLong(1);

    private final Map<Long, Advertiser> advertisers = new ConcurrentHashMap<>();
    private final Map<Long, AdPlan> plans = new ConcurrentHashMap<>();
    private final Map<Long, AdMaterial> materials = new ConcurrentHashMap<>();
    private final Map<Long, Impression> impressions = new ConcurrentHashMap<>();
    private final Map<Long, Click> clicks = new ConcurrentHashMap<>();
    private final Map<Long, Conversion> conversions = new ConcurrentHashMap<>();
    private final Map<Long, Settlement> settlements = new ConcurrentHashMap<>();
    private final Map<Long, DailyReport> dailyReports = new ConcurrentHashMap<>();
    private final Map<Long, Adjustment> adjustments = new ConcurrentHashMap<>();

    private final Map<String, Impression> impressionsByRequestId = new ConcurrentHashMap<>();
    private final Map<Long, List<AdPlan>> plansByAdvertiserId = new ConcurrentHashMap<>();
    private final Map<Long, List<AdMaterial>> materialsByPlanId = new ConcurrentHashMap<>();

    public void init() {
        Advertiser advertiser1 = new Advertiser();
        advertiser1.setId(advertiserIdGenerator.getAndIncrement());
        advertiser1.setName("科技公司A");
        advertiser1.setBalance(new BigDecimal("50000.00"));
        advertiser1.setTotalBudget(new BigDecimal("100000.00"));
        advertiser1.setDailyBudget(new BigDecimal("5000.00"));
        advertiser1.setDailySpent(BigDecimal.ZERO);
        advertiser1.setTotalSpent(BigDecimal.ZERO);
        advertiser1.setIsActive(true);
        advertiser1.setCreatedAt(LocalDateTime.now());
        advertiser1.setUpdatedAt(LocalDateTime.now());
        advertisers.put(advertiser1.getId(), advertiser1);

        Advertiser advertiser2 = new Advertiser();
        advertiser2.setId(advertiserIdGenerator.getAndIncrement());
        advertiser2.setName("电商公司B");
        advertiser2.setBalance(new BigDecimal("30000.00"));
        advertiser2.setTotalBudget(new BigDecimal("80000.00"));
        advertiser2.setDailyBudget(new BigDecimal("3000.00"));
        advertiser2.setDailySpent(BigDecimal.ZERO);
        advertiser2.setTotalSpent(BigDecimal.ZERO);
        advertiser2.setIsActive(true);
        advertiser2.setCreatedAt(LocalDateTime.now());
        advertiser2.setUpdatedAt(LocalDateTime.now());
        advertisers.put(advertiser2.getId(), advertiser2);

        AdPlan plan1 = new AdPlan();
        plan1.setId(planIdGenerator.getAndIncrement());
        plan1.setAdvertiserId(advertiser1.getId());
        plan1.setName("新品推广计划");
        plan1.setStartDate(LocalDate.now().minusDays(5));
        plan1.setEndDate(LocalDate.now().plusDays(25));
        plan1.setBidPrice(new BigDecimal("2.50"));
        plan1.setDailyBudget(new BigDecimal("2000.00"));
        plan1.setTotalBudget(new BigDecimal("50000.00"));
        plan1.setDailySpent(BigDecimal.ZERO);
        plan1.setTotalSpent(BigDecimal.ZERO);
        plan1.setTargetGenders(Arrays.asList("MALE", "FEMALE"));
        plan1.setTargetAgeRanges(Arrays.asList(18, 25, 35, 45));
        plan1.setTargetRegions(Arrays.asList("北京", "上海", "广州", "深圳"));
        plan1.setTargetInterests(Arrays.asList("科技", "数码", "游戏"));
        plan1.setStatus(PlanStatus.ACTIVE);
        plan1.setCreatedAt(LocalDateTime.now());
        plan1.setUpdatedAt(LocalDateTime.now());
        plans.put(plan1.getId(), plan1);
        plansByAdvertiserId.computeIfAbsent(advertiser1.getId(), k -> new ArrayList<>()).add(plan1);

        AdPlan plan2 = new AdPlan();
        plan2.setId(planIdGenerator.getAndIncrement());
        plan2.setAdvertiserId(advertiser2.getId());
        plan2.setName("618促销活动");
        plan2.setStartDate(LocalDate.now().minusDays(3));
        plan2.setEndDate(LocalDate.now().plusDays(30));
        plan2.setBidPrice(new BigDecimal("1.80"));
        plan2.setDailyBudget(new BigDecimal("1500.00"));
        plan2.setTotalBudget(new BigDecimal("30000.00"));
        plan2.setDailySpent(BigDecimal.ZERO);
        plan2.setTotalSpent(BigDecimal.ZERO);
        plan2.setTargetGenders(Arrays.asList("FEMALE"));
        plan2.setTargetAgeRanges(Arrays.asList(18, 25, 35));
        plan2.setTargetRegions(Arrays.asList("杭州", "成都", "武汉"));
        plan2.setTargetInterests(Arrays.asList("购物", "美妆", "时尚"));
        plan2.setStatus(PlanStatus.ACTIVE);
        plan2.setCreatedAt(LocalDateTime.now());
        plan2.setUpdatedAt(LocalDateTime.now());
        plans.put(plan2.getId(), plan2);
        plansByAdvertiserId.computeIfAbsent(advertiser2.getId(), k -> new ArrayList<>()).add(plan2);

        AdMaterial material1 = new AdMaterial();
        material1.setId(materialIdGenerator.getAndIncrement());
        material1.setPlanId(plan1.getId());
        material1.setName("新品宣传海报");
        material1.setType("IMAGE");
        material1.setContentUrl("https://example.com/ad1.jpg");
        material1.setTitle("全新智能手表，限时抢购");
        material1.setDescription("首款搭载自研芯片的智能手表，续航长达14天");
        material1.setStatus(MaterialStatus.APPROVED);
        material1.setCreatedAt(LocalDateTime.now());
        material1.setUpdatedAt(LocalDateTime.now());
        materials.put(material1.getId(), material1);
        materialsByPlanId.computeIfAbsent(plan1.getId(), k -> new ArrayList<>()).add(material1);

        AdMaterial material2 = new AdMaterial();
        material2.setId(materialIdGenerator.getAndIncrement());
        material2.setPlanId(plan2.getId());
        material2.setName("618促销视频");
        material2.setType("VIDEO");
        material2.setContentUrl("https://example.com/ad2.mp4");
        material2.setTitle("618大促，全场5折起");
        material2.setDescription("精选好物，限时特惠，先到先得");
        material2.setStatus(MaterialStatus.APPROVED);
        material2.setCreatedAt(LocalDateTime.now());
        material2.setUpdatedAt(LocalDateTime.now());
        materials.put(material2.getId(), material2);
        materialsByPlanId.computeIfAbsent(plan2.getId(), k -> new ArrayList<>()).add(material2);
    }

    public long nextAdvertiserId() { return advertiserIdGenerator.getAndIncrement(); }
    public long nextPlanId() { return planIdGenerator.getAndIncrement(); }
    public long nextMaterialId() { return materialIdGenerator.getAndIncrement(); }
    public long nextImpressionId() { return impressionIdGenerator.getAndIncrement(); }
    public long nextClickId() { return clickIdGenerator.getAndIncrement(); }
    public long nextConversionId() { return conversionIdGenerator.getAndIncrement(); }
    public long nextSettlementId() { return settlementIdGenerator.getAndIncrement(); }
    public long nextReportId() { return reportIdGenerator.getAndIncrement(); }
    public long nextAdjustmentId() { return adjustmentIdGenerator.getAndIncrement(); }

    public Map<Long, Advertiser> getAdvertisers() { return advertisers; }
    public Map<Long, AdPlan> getPlans() { return plans; }
    public Map<Long, AdMaterial> getMaterials() { return materials; }
    public Map<Long, Impression> getImpressions() { return impressions; }
    public Map<Long, Click> getClicks() { return clicks; }
    public Map<Long, Conversion> getConversions() { return conversions; }
    public Map<Long, Settlement> getSettlements() { return settlements; }
    public Map<Long, DailyReport> getDailyReports() { return dailyReports; }
    public Map<Long, Adjustment> getAdjustments() { return adjustments; }
    public Map<String, Impression> getImpressionsByRequestId() { return impressionsByRequestId; }
    public Map<Long, List<AdPlan>> getPlansByAdvertiserId() { return plansByAdvertiserId; }
    public Map<Long, List<AdMaterial>> getMaterialsByPlanId() { return materialsByPlanId; }
}
