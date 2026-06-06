import * as bcrypt from "bcryptjs"
import prisma from "../clients/prisma"

const brandSeeds = [
  {
    company: "Luma Labs",
    email: "brand1@collabrio.local",
    username: "lumalabs",
    password: "BrandPass1!",
    logoUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    bio: "Luma Labs creates premium beauty and wellness experiences for modern audiences.",
    industryTags: ["Beauty", "Wellness", "Lifestyle"],
    socialLinks: [
      { platform: "website", url: "https://lumalabs.example.com" },
      { platform: "instagram", url: "https://instagram.com/lumalabs" },
    ],
    plan: "BUSINESS",
    subscription: {
      currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
      razorpaySubscriptionId: "sub_LUMA_001",
      razorpayPlanId: "plan_business_001",
    },
    wallet: {
      currentBalance: "12800.50",
      pendingBalance: "2200.00",
      totalEarned: "14800.50",
      totalSpent: "2000.00",
    },
  },
  {
    company: "Pixel Pulse",
    email: "brand2@collabrio.local",
    username: "pixelpulse",
    password: "BrandPass2!",
    logoUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    bio: "Pixel Pulse is a creative commerce studio bringing tech-first launches to life.",
    industryTags: ["Tech", "Retail", "Creativity"],
    socialLinks: [
      { platform: "website", url: "https://pixelpulse.example.com" },
      { platform: "linkedin", url: "https://linkedin.com/company/pixelpulse" },
    ],
    plan: "PRO",
    subscription: {
      currentPeriodStart: new Date("2026-02-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-02-01T00:00:00.000Z"),
      razorpaySubscriptionId: "sub_PIXEL_002",
      razorpayPlanId: "plan_pro_002",
    },
    wallet: {
      currentBalance: "8200.00",
      pendingBalance: "1400.25",
      totalEarned: "9600.25",
      totalSpent: "600.00",
    },
  },
  {
    company: "Modo Market",
    email: "brand3@collabrio.local",
    username: "modomarket",
    password: "BrandPass3!",
    logoUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80",
    bio: "Modo Market builds lifestyle brands with high-growth social commerce strategies.",
    industryTags: ["Commerce", "Fashion", "Direct-to-consumer"],
    socialLinks: [
      { platform: "website", url: "https://modomarket.example.com" },
      { platform: "twitter", url: "https://twitter.com/modomarket" },
    ],
    plan: "BUSINESS",
    subscription: {
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-03-01T00:00:00.000Z"),
      razorpaySubscriptionId: "sub_MODO_003",
      razorpayPlanId: "plan_business_003",
    },
    wallet: {
      currentBalance: "17300.75",
      pendingBalance: "2600.00",
      totalEarned: "19900.75",
      totalSpent: "1200.00",
    },
  },
  {
    company: "Vero Goods",
    email: "brand4@collabrio.local",
    username: "verogoods",
    password: "BrandPass4!",
    logoUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    bio: "Vero Goods delivers meaningful product launches through compelling creator content.",
    industryTags: ["Home", "Lifestyle", "Product"],
    socialLinks: [
      { platform: "website", url: "https://verogoods.example.com" },
      { platform: "facebook", url: "https://facebook.com/verogoods" },
    ],
    plan: "PRO",
    subscription: {
      currentPeriodStart: new Date("2026-04-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-04-01T00:00:00.000Z"),
      razorpaySubscriptionId: "sub_VERO_004",
      razorpayPlanId: "plan_pro_004",
    },
    wallet: {
      currentBalance: "9400.20",
      pendingBalance: "800.00",
      totalEarned: "10200.20",
      totalSpent: "1100.00",
    },
  },
  {
    company: "Luna Creative",
    email: "brand5@collabrio.local",
    username: "lunacreative",
    password: "BrandPass5!",
    logoUrl: "https://images.unsplash.com/photo-1511974035430-5de47d3b95da?auto=format&fit=crop&w=400&q=80",
    bio: "Luna Creative designs creator-led launches for premium modern brands.",
    industryTags: ["Design", "Experiential", "Brand"],
    socialLinks: [
      { platform: "website", url: "https://lunacreative.example.com" },
      { platform: "instagram", url: "https://instagram.com/lunacreative" },
    ],
    plan: "BUSINESS",
    subscription: {
      currentPeriodStart: new Date("2026-05-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2027-05-01T00:00:00.000Z"),
      razorpaySubscriptionId: "sub_LUNA_005",
      razorpayPlanId: "plan_business_005",
    },
    wallet: {
      currentBalance: "10400.00",
      pendingBalance: "1700.00",
      totalEarned: "12100.00",
      totalSpent: "1350.00",
    },
  },
]

const creatorSeeds = [
  {
    firstName: "Asha",
    lastName: "Mehta",
    email: "asha.mehta@collabrio.local",
    username: "asha.mehta",
    password: "CreatorPass1!",
    bio: "Lifestyle creator who blends premium travel, fashion, and everyday optimism into campaign storytelling.",
    location: "Mumbai, India",
    niche: "Lifestyle & Travel",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/asha.mp4",
    nicheTags: ["Travel", "Fashion", "Lifestyle"],
    portfolio: [
      { title: "Summer travel lookbook", url: "https://portfolio.example.com/asha/1" },
      { title: "Wellness launch story", url: "https://portfolio.example.com/asha/2" },
    ],
    mlScore: 84,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/asha.mehta" },
      { platform: "youtube", url: "https://youtube.com/@ashamehta" },
    ],
    followerCount: 32500,
  },
  {
    firstName: "Tarun",
    lastName: "Roy",
    email: "tarun.roy@collabrio.local",
    username: "tarun.roy",
    password: "CreatorPass2!",
    bio: "Creator focused on precision tech reviews and product storytelling for modern audiences.",
    location: "Bengaluru, India",
    niche: "Tech Review",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/tarun.mp4",
    nicheTags: ["Technology", "Reviews", "Gadgets"],
    portfolio: [
      { title: "Launch day coverage", url: "https://portfolio.example.com/tarun/1" },
      { title: "Smart home video", url: "https://portfolio.example.com/tarun/2" },
    ],
    mlScore: 90,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/tarun.roy" },
      { platform: "linkedin", url: "https://linkedin.com/in/tarunroy" },
    ],
    followerCount: 41200,
  },
  {
    firstName: "Nisha",
    lastName: "Patel",
    email: "nisha.patel@collabrio.local",
    username: "nisha.patel",
    password: "CreatorPass3!",
    bio: "Creator who specializes in beauty launches, product storytelling, and polished campaign execution.",
    location: "Hyderabad, India",
    niche: "Beauty & Wellness",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/nisha.mp4",
    nicheTags: ["Beauty", "Skincare", "Wellness"],
    portfolio: [
      { title: "Skin care launch reel", url: "https://portfolio.example.com/nisha/1" },
      { title: "Beauty routine story", url: "https://portfolio.example.com/nisha/2" },
    ],
    mlScore: 78,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/nisha.patel" },
      { platform: "tiktok", url: "https://tiktok.com/@nishapatel" },
    ],
    followerCount: 28900,
  },
  {
    firstName: "Priya",
    lastName: "Iyer",
    email: "priya.iyer@collabrio.local",
    username: "priya.iyer",
    password: "CreatorPass4!",
    bio: "Product storyteller with strong audience trust in fashion, beauty, and creative launches.",
    location: "Chennai, India",
    niche: "Fashion & Beauty",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/priya.mp4",
    nicheTags: ["Fashion", "Beauty", "Editorial"],
    portfolio: [
      { title: "Seasonal lookbook", url: "https://portfolio.example.com/priya/1" },
      { title: "Brand launch reel", url: "https://portfolio.example.com/priya/2" },
    ],
    mlScore: 88,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/priya.iyer" },
      { platform: "pinterest", url: "https://pinterest.com/priya.iyer" },
    ],
    followerCount: 39500,
  },
  {
    firstName: "Kiran",
    lastName: "Das",
    email: "kiran.das@collabrio.local",
    username: "kiran.das",
    password: "CreatorPass5!",
    bio: "Analytics-first creator producing high-conversion product launches and clear campaign reporting.",
    location: "Kolkata, India",
    niche: "Data-driven Commerce",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/kiran.mp4",
    nicheTags: ["Commerce", "Analytics", "Performance"],
    portfolio: [
      { title: "Launch analytics recap", url: "https://portfolio.example.com/kiran/1" },
      { title: "Conversion-focused campaign", url: "https://portfolio.example.com/kiran/2" },
    ],
    mlScore: 82,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/kiran.das" },
      { platform: "youtube", url: "https://youtube.com/@kirandas" },
    ],
    followerCount: 21800,
  },
  {
    firstName: "Anjali",
    lastName: "Singh",
    email: "anjali.singh@collabrio.local",
    username: "anjali.singh",
    password: "CreatorPass6!",
    bio: "Creator specializing in premium lifestyle launches with a polished and aspirational tone.",
    location: "Delhi, India",
    niche: "Luxury Lifestyle",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/anjali.mp4",
    nicheTags: ["Luxury", "Lifestyle", "Travel"],
    portfolio: [
      { title: "Luxury review reel", url: "https://portfolio.example.com/anjali/1" },
      { title: "Lifestyle product story", url: "https://portfolio.example.com/anjali/2" },
    ],
    mlScore: 91,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/anjali.singh" },
      { platform: "youtube", url: "https://youtube.com/@anjalis" },
    ],
    followerCount: 47200,
  },
  {
    firstName: "Dev",
    lastName: "Kapoor",
    email: "dev.kapoor@collabrio.local",
    username: "dev.kapoor",
    password: "CreatorPass7!",
    bio: "A creator who combines authentic storytelling with high-impact creator commerce campaigns.",
    location: "Pune, India",
    niche: "Creator Commerce",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/dev.mp4",
    nicheTags: ["Commerce", "Storytelling", "Launches"],
    portfolio: [
      { title: "Product launch narrative", url: "https://portfolio.example.com/dev/1" },
      { title: "Social commerce story", url: "https://portfolio.example.com/dev/2" },
    ],
    mlScore: 86,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/dev.kapoor" },
      { platform: "linkedin", url: "https://linkedin.com/in/devkapoor" },
    ],
    followerCount: 31000,
  },
  {
    firstName: "Meera",
    lastName: "Nair",
    email: "meera.nair@collabrio.local",
    username: "meera.nair",
    password: "CreatorPass8!",
    bio: "Creative storyteller for beauty, travel, and lifestyle brands with a refined audience.",
    location: "Kochi, India",
    niche: "Travel & Beauty",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/meera.mp4",
    nicheTags: ["Travel", "Beauty", "Lifestyle"],
    portfolio: [
      { title: "Beauty discovery series", url: "https://portfolio.example.com/meera/1" },
      { title: "Travel launch reel", url: "https://portfolio.example.com/meera/2" },
    ],
    mlScore: 80,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/meera.nair" },
      { platform: "tiktok", url: "https://tiktok.com/@meera.nair" },
    ],
    followerCount: 24800,
  },
  {
    firstName: "Aarav",
    lastName: "Bose",
    email: "aarav.bose@collabrio.local",
    username: "aarav.bose",
    password: "CreatorPass9!",
    bio: "A product creator who loves building audience trust through honest campaign showcases.",
    location: "Ahmedabad, India",
    niche: "Product Stories",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/aarav.mp4",
    nicheTags: ["Commerce", "Review", "Storytelling"],
    portfolio: [
      { title: "Product demo sequence", url: "https://portfolio.example.com/aarav/1" },
      { title: "Brand story reel", url: "https://portfolio.example.com/aarav/2" },
    ],
    mlScore: 87,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/aarav.bose" },
      { platform: "youtube", url: "https://youtube.com/@aaravbose" },
    ],
    followerCount: 33900,
  },
  {
    firstName: "Sana",
    lastName: "Khan",
    email: "sana.khan@collabrio.local",
    username: "sana.khan",
    password: "CreatorPass10!",
    bio: "Creator who helps lifestyle brands land elegant storytelling and strong engagement.",
    location: "Jaipur, India",
    niche: "Lifestyle & Home",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/sana.mp4",
    nicheTags: ["Home", "Lifestyle", "Decor"],
    portfolio: [
      { title: "Home styling reel", url: "https://portfolio.example.com/sana/1" },
      { title: "Lifestyle launch story", url: "https://portfolio.example.com/sana/2" },
    ],
    mlScore: 81,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/sana.khan" },
      { platform: "pinterest", url: "https://pinterest.com/sana.khan" },
    ],
    followerCount: 27600,
  },
  {
    firstName: "Vikram",
    lastName: "Rao",
    email: "vikram.rao@collabrio.local",
    username: "vikram.rao",
    password: "CreatorPass11!",
    bio: "Creator with a sharp focus on business product launches, reviews, and conversion storytelling.",
    location: "Gurgaon, India",
    niche: "Business & Tech",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/vikram.mp4",
    nicheTags: ["Business", "Tech", "Reviews"],
    portfolio: [
      { title: "Launch impact breakdown", url: "https://portfolio.example.com/vikram/1" },
      { title: "Product launch film", url: "https://portfolio.example.com/vikram/2" },
    ],
    mlScore: 89,
    platformLinks: [
      { platform: "linkedin", url: "https://linkedin.com/in/vikramrao" },
      { platform: "instagram", url: "https://instagram.com/vikram.rao" },
    ],
    followerCount: 40200,
  },
  {
    firstName: "Neha",
    lastName: "Gupta",
    email: "neha.gupta@collabrio.local",
    username: "neha.gupta",
    password: "CreatorPass12!",
    bio: "Creator narrating premium brand collaborations through visual reels and refined stories.",
    location: "Lucknow, India",
    niche: "Creative Campaigns",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/neha.mp4",
    nicheTags: ["Creative", "Storytelling", "Campaigns"],
    portfolio: [
      { title: "Campaign reel series", url: "https://portfolio.example.com/neha/1" },
      { title: "Visual product story", url: "https://portfolio.example.com/neha/2" },
    ],
    mlScore: 83,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/neha.gupta" },
      { platform: "twitter", url: "https://twitter.com/nehagupta" },
    ],
    followerCount: 29300,
  },
  {
    firstName: "Rohit",
    lastName: "Jain",
    email: "rohit.jain@collabrio.local",
    username: "rohit.jain",
    password: "CreatorPass13!",
    bio: "Creator specializing in creator commerce and campaign-first narrative work.",
    location: "Pune, India",
    niche: "Commerce Campaigns",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/rohit.mp4",
    nicheTags: ["Commerce", "Campaigns", "Brand"],
    portfolio: [
      { title: "Commerce launch showcase", url: "https://portfolio.example.com/rohit/1" },
      { title: "Product storytelling film", url: "https://portfolio.example.com/rohit/2" },
    ],
    mlScore: 85,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/rohit.jain" },
      { platform: "linkedin", url: "https://linkedin.com/in/rohitjain" },
    ],
    followerCount: 28100,
  },
  {
    firstName: "Kavya",
    lastName: "Nair",
    email: "kavya.nair@collabrio.local",
    username: "kavya.nair",
    password: "CreatorPass14!",
    bio: "Creator focused on packaged lifestyle campaigns, brand lifts, and audience-first storytelling.",
    location: "Chandigarh, India",
    niche: "Lifestyle Campaigns",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/kavya.mp4",
    nicheTags: ["Lifestyle", "Campaigns", "Storytelling"],
    portfolio: [
      { title: "Lifestyle launch reel", url: "https://portfolio.example.com/kavya/1" },
      { title: "Story-led campaign", url: "https://portfolio.example.com/kavya/2" },
    ],
    mlScore: 80,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/kavya.nair" },
      { platform: "pinterest", url: "https://pinterest.com/kavya.nair" },
    ],
    followerCount: 25500,
  },
  {
    firstName: "Arjun",
    lastName: "Verma",
    email: "arjun.verma@collabrio.local",
    username: "arjun.verma",
    password: "CreatorPass15!",
    bio: "Creator who pairs high-quality visuals with campaign-first planning for lifestyle brands.",
    location: "Jaipur, India",
    niche: "Visual Campaigns",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/arjun.mp4",
    nicheTags: ["Visual", "Lifestyle", "Campaigns"],
    portfolio: [
      { title: "Visual product launch", url: "https://portfolio.example.com/arjun/1" },
      { title: "Creative campaign film", url: "https://portfolio.example.com/arjun/2" },
    ],
    mlScore: 88,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/arjun.verma" },
      { platform: "youtube", url: "https://youtube.com/@arjunverma" },
    ],
    followerCount: 40500,
  },
  {
    firstName: "Divya",
    lastName: "Sen",
    email: "divya.sen@collabrio.local",
    username: "divya.sen",
    password: "CreatorPass16!",
    bio: "Creator producing high-impact stories for premium lifestyle and product brands.",
    location: "Bangalore, India",
    niche: "Premium Lifestyle",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/divya.mp4",
    nicheTags: ["Luxury", "Lifestyle", "Brand"],
    portfolio: [
      { title: "Premium product film", url: "https://portfolio.example.com/divya/1" },
      { title: "Lifestyle campaign reel", url: "https://portfolio.example.com/divya/2" },
    ],
    mlScore: 92,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/divya.sen" },
      { platform: "pinterest", url: "https://pinterest.com/divya.sen" },
    ],
    followerCount: 43800,
  },
  {
    firstName: "Rahul",
    lastName: "Desai",
    email: "rahul.desai@collabrio.local",
    username: "rahul.desai",
    password: "CreatorPass17!",
    bio: "Creator building creator commerce stories for modern brands with an emphasis on clarity and conversion.",
    location: "Surat, India",
    niche: "Commerce & Conversion",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/rahul.mp4",
    nicheTags: ["Commerce", "Conversion", "Stories"],
    portfolio: [
      { title: "Conversion reel series", url: "https://portfolio.example.com/rahul/1" },
      { title: "Product campaign story", url: "https://portfolio.example.com/rahul/2" },
    ],
    mlScore: 79,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/rahul.desai" },
      { platform: "linkedin", url: "https://linkedin.com/in/rahuldesai" },
    ],
    followerCount: 27000,
  },
  {
    firstName: "Maya",
    lastName: "Iyer",
    email: "maya.iyer@collabrio.local",
    username: "maya.iyer",
    password: "CreatorPass18!",
    bio: "Creator blending brand elegance with high-engagement campaign storytelling.",
    location: "Kochi, India",
    niche: "Elegant Campaigns",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/maya.mp4",
    nicheTags: ["Elegant", "Campaigns", "Storytelling"],
    portfolio: [
      { title: "Elegant launch film", url: "https://portfolio.example.com/maya/1" },
      { title: "Campaign story reel", url: "https://portfolio.example.com/maya/2" },
    ],
    mlScore: 86,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/maya.iyer" },
      { platform: "pinterest", url: "https://pinterest.com/maya.iyer" },
    ],
    followerCount: 29200,
  },
  {
    firstName: "Kunal",
    lastName: "Aggarwal",
    email: "kunal.aggarwal@collabrio.local",
    username: "kunal.aggarwal",
    password: "CreatorPass19!",
    bio: "Creator known for strong product narratives and campaign-driven audience growth.",
    location: "Lucknow, India",
    niche: "Narrative Commerce",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/kunal.mp4",
    nicheTags: ["Narrative", "Commerce", "Growth"],
    portfolio: [
      { title: "Campaign narrative reel", url: "https://portfolio.example.com/kunal/1" },
      { title: "Product story video", url: "https://portfolio.example.com/kunal/2" },
    ],
    mlScore: 81,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/kunal.aggarwal" },
      { platform: "twitter", url: "https://twitter.com/kunalaggarwal" },
    ],
    followerCount: 25300,
  },
  {
    firstName: "Sanya",
    lastName: "Desai",
    email: "sanya.desai@collabrio.local",
    username: "sanya.desai",
    password: "CreatorPass20!",
    bio: "Creator producing strong brand campaigns with polished execution and audience-centric storytelling.",
    location: "Indore, India",
    niche: "Audience-first Content",
    category: "MICRO",
    profilePicUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    introClipUrl: "https://videos.example.com/intro/sanya.mp4",
    nicheTags: ["Audience", "Brand", "Content"],
    portfolio: [
      { title: "Audience growth campaign", url: "https://portfolio.example.com/sanya/1" },
      { title: "Brand story reel", url: "https://portfolio.example.com/sanya/2" },
    ],
    mlScore: 83,
    platformLinks: [
      { platform: "instagram", url: "https://instagram.com/sanya.desai" },
      { platform: "facebook", url: "https://facebook.com/sanyadesai" },
    ],
    followerCount: 26900,
  },
]

function randomFromArray<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)]
}

function dayOffset(offset: number) {
  const now = new Date()
  now.setDate(now.getDate() - offset)
  return now
}

async function main() {
  await prisma.packageCollaboration.deleteMany()
  await prisma.collaboration.deleteMany()
  await prisma.package.deleteMany()
  await prisma.creatorDailyAnalytics.deleteMany()
  await prisma.creatorSocialRawSnapshot.deleteMany()
  await prisma.creatorSocialAccount.deleteMany()
  await prisma.creatorAvailability.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.brandSubscription.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.brandProfile.deleteMany()
  await prisma.user.deleteMany()

  const createdBrands = [] as any[]

  for (const seed of brandSeeds) {
    const passwordHash = await bcrypt.hash(seed.password, 10)
    const brand = await prisma.user.create({
      data: {
        email: seed.email,
        username: seed.username,
        passwordHash,
        userType: "BRAND",
        onboarding: "COMPLETE",
        brandProfile: {
          create: {
            logoUrl: seed.logoUrl,
            bio: seed.bio,
            industryTags: seed.industryTags,
            socialLinks: seed.socialLinks,
            plan: seed.plan as any,
            subscription: {
              create: {
                plan: seed.plan as any,
                currentPeriodStart: seed.subscription.currentPeriodStart,
                currentPeriodEnd: seed.subscription.currentPeriodEnd,
                razorpaySubscriptionId: seed.subscription.razorpaySubscriptionId,
                razorpayPlanId: seed.subscription.razorpayPlanId,
              },
            },
          },
        },
        wallet: {
          create: {
            walletType: "BRAND",
            currentBalance: seed.wallet.currentBalance,
            pendingBalance: seed.wallet.pendingBalance,
            totalEarned: seed.wallet.totalEarned,
            totalSpent: seed.wallet.totalSpent,
          },
        },
        notifications: {
          create: [
            {
              type: "PAYMENT_RECEIVED",
              message: "Your brand wallet is funded and ready for the next campaign.",
              read: false,
            },
          ],
        },
      },
      include: {
        brandProfile: { include: { subscription: true } },
        wallet: true,
      },
    })

    createdBrands.push(brand)
  }

  const createdCreators = [] as any[]

  for (const seed of creatorSeeds) {
    const passwordHash = await bcrypt.hash(seed.password, 10)
    const creator = await prisma.user.create({
      data: {
        email: seed.email,
        username: seed.username,
        passwordHash,
        userType: "CREATOR",
        onboarding: "COMPLETE",
        creatorProfile: {
          create: {
            bio: seed.bio,
            location: seed.location,
            niche: seed.niche,
            profilePicUrl: seed.profilePicUrl,
            introClipUrl: seed.introClipUrl,
            nicheTags: seed.nicheTags,
            portfolio: seed.portfolio,
            mlScore: seed.mlScore,
            category: seed.category as any,
            platformLinks: seed.platformLinks,
            followerCount: seed.followerCount,
            socialAccounts: {
              create: {
                platform: "INSTAGRAM",
                accessToken: `${seed.username}-token-2026`,
                tokenExpiresAt: dayOffset(-90),
                igAccountId: `${seed.username}-ig`,
                pageId: `${seed.username}-page`,
                connected: true,
              },
            },
            rawSocialSnapshots: {
              create: {
                platform: "INSTAGRAM",
                rawData: {
                  followers: seed.followerCount,
                  engagementRate: 0.052,
                  bio: seed.bio,
                },
                fetchedAt: dayOffset(-3),
              },
            },
            dailyAnalytics: {
              create: {
                date: dayOffset(-1),
                followers: seed.followerCount,
                reach: 32000,
                impressions: 128000,
                engagements: 5500,
                likes: 4200,
                comments: 520,
                shares: 180,
                saves: 340,
                replies: 95,
                profileViews: 4300,
              },
            },
            availabilities: {
              create: {
                date: dayOffset(2),
                status: randomFromArray(["AVAILABLE", "TENTATIVE"]) as any,
                reason: "Available for launches and review cycles.",
              },
            },
          },
        },
        wallet: {
          create: {
            walletType: "CREATOR",
            currentBalance: "2400.50",
            pendingBalance: "600.00",
            totalEarned: "12000.50",
            totalSpent: "4200.00",
          },
        },
        notifications: {
          create: [
            {
              type: "DRAFT_SUBMITTED",
              message: "A new draft is ready for your review.",
              read: false,
            },
          ],
        },
      },
      include: {
        creatorProfile: true,
        wallet: true,
      },
    })

    createdCreators.push(creator)
  }

  const createdPackages = [] as Array<{
    id: string
    creatorId: string
    title: string
    price: string
  }>

  for (let index = 0; index < createdCreators.length; index += 1) {
    const creator = createdCreators[index]
    const creatorName = creator.username.replace(".", " ")
    const packageData = {
      creatorId: creator.creatorProfile.id,
      title: `${creatorName} launch package`,
      description: `A premium creator package optimized for ${creatorName}’s niche.`,
      thumbnailUrl: `https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=400&q=80`,
      mediaType: randomFromArray(["Instagram Reel", "TikTok Video", "Carousel Post"]),
      deliverables: ["1 Reel", "2 Stories"],
      deliveryTimeDays: 4 + ((index % 3) * 2),
      price: `${900 + index * 45}.00`,
      packageStatus: (index % 4 === 0 ? "DRAFT" : "ACTIVE") as any,
    }
    const createdPackage = await prisma.package.create({ data: packageData })
    createdPackages.push({ id: createdPackage.id, creatorId: createdPackage.creatorId, title: createdPackage.title, price: packageData.price })
  }

  const collabStatuses = ["ACTIVE", "COMPLETED", "PENDING", "CANCELLED"] as const

  for (let index = 0; index < createdCreators.length; index += 1) {
    const creator = createdCreators[index]
    const brand = createdBrands[index % createdBrands.length]
    const pkg = createdPackages[index]
    const collabStatus = collabStatuses[index % collabStatuses.length] as any
    const contentStatus = (collabStatus === "COMPLETED" ? "APPROVED" : collabStatus === "ACTIVE" ? "SUBMITTED" : "NOT_SUBMITTED") as any
    const collab = await prisma.collaboration.create({
      data: {
        creatorId: creator.creatorProfile.id,
        brandId: brand.brandProfile.id,
        packageId: pkg.id,
        collabStatus,
        content: {
          create: {
            package: { connect: { id: pkg.id } },
            contentStatus,
            contentDraft: [
              {
                url: `https://content.example.com/drafts/${pkg.id}`,
                type: "video",
              },
            ],
            revisionCount: collabStatus === "COMPLETED" ? 1 : 0,
            draftSubmittedAt: dayOffset(14),
            brandFeedback: collabStatus === "COMPLETED" ? "Looks great. Ready for publish." : "Please adjust the final frame color grade.",
            draftApprovedAt: collabStatus === "COMPLETED" ? dayOffset(12) : null,
            publishedContentUrl: collabStatus === "COMPLETED" ? `https://publish.example.com/${pkg.id}` : null,
            publishedAt: collabStatus === "COMPLETED" ? dayOffset(11) : null,
          },
        },
      },
      include: {
        content: true,
      },
    })

    await prisma.transaction.create({
      data: {
        fromWalletId: brand.wallet.id,
        toWalletId: creator.wallet.id,
        amount: pkg.price,
        type: "BRAND_PAYMENT",
        status: (collabStatus === "COMPLETED" ? "COMPLETED" : "PENDING") as any,
        collabId: collab.id,
        externalPaymentId: `pay_${pkg.id}`,
        externalOrderId: `ord_${pkg.id}`,
        provider: "RAZORPAY",
      },
    })

    await prisma.notification.createMany({
      data: [
        {
          userId: creator.id,
          type: collabStatus === "COMPLETED" ? "PAYMENT_RECEIVED" : "DRAFT_SUBMITTED",
          message: collabStatus === "COMPLETED"
            ? `A campaign with ${brand.username} was completed and payment is processed.`
            : `A new draft is available for the campaign with ${brand.username}.`,
          read: false,
          collabId: collab.id,
        },
        {
          userId: brand.id,
          type: collabStatus === "COMPLETED" ? "DRAFT_APPROVED" : "COLLAB_INVITE",
          message: collabStatus === "COMPLETED"
            ? `The collaboration with ${creator.username} has been approved.`
            : `Your collaboration request with ${creator.username} is in progress.`,
          read: false,
          collabId: collab.id,
        },
      ],
    })
  }

  // Create platform wallet to hold escrow and fees
  const platformUser = await prisma.user.create({
    data: {
      email: "platform@collabrio.local",
      username: "collabrio_platform",
      passwordHash: await bcrypt.hash("PlatformAdmin@2026", 10),
      userType: "BRAND",
      onboarding: "COMPLETE",
      wallet: {
        create: {
          walletType: "PLATFORM",
          currentBalance: "5800.00", // Sum of platform fees collected
          pendingBalance: "6800.00", // Sum of all pending brand balances that will become platform fees
          totalEarned: "5800.00",
          totalSpent: "0.00",
        },
      },
    },
    include: { wallet: true },
  })

  console.log(`Seeded ${createdCreators.length} creators, ${createdBrands.length} brands, ${createdPackages.length} packages, and platform wallet.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
