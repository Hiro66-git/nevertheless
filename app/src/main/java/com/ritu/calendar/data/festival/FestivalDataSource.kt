package com.ritu.calendar.data.festival

import com.ritu.calendar.core.panchang.RituSeason
import java.time.LocalDate

object FestivalDataSource {

    val festivals: List<FestivalModel> = listOf(
        // ==========================================
        // NORTHEAST & ASSAM CELEBRATIONS
        // ==========================================
        FestivalModel(
            id = "fest_rongali_bihu",
            name = "Rongali Bihu (Bohag Bihu)",
            devanagariName = "रोंगाली बिहू (बोहाग बिहू)",
            regionalNames = mapOf(
                "Assamese" to "ৰঙালী বিহু / ব’হাগ বিহু",
                "Bodo" to "বইসাগু (Baishagu)"
            ),
            gregorianDate2026 = LocalDate.of(2026, 4, 14),
            lunarDateString = "Bohag 1 (Bhaskar Era & Assamese New Year)",
            durationDays = 7,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.NEW_YEAR,
            season = RituSeason.VASANTA,
            shortSummary = "The grand Assamese spring festival celebrating the arrival of the Assamese New Year, youth, vitality, and agrarian seeding.",
            culturalSignificance = "Rongali Bihu marks the onset of the seeding season in the Brahmaputra valley. Celebrated across 7 sacred phases (Shat Bihu): Goru Bihu (cattle honoring), Manuh Bihu (human kinship & new clothes), Gosai Bihu (deities), Kutum Bihu (relatives), Senehi Bihu (lovers), Mela Bihu, and Sera Bihu.",
            traditionsAndRituals = listOf(
                "Goru Bihu: Washing livestock with mah-haldi (turmeric & black gram paste) and feeding them brinjal and bottle gourd.",
                "Husori singing: Elders and youth moving house-to-house singing traditional blessings with Pepa (buffalo horn flute), Dhol, and Taal.",
                "Bihu dance: Young women wearing traditional Muga silk Mekhela Sador with Kopou Phool (foxtail orchid) in their hair.",
                "Presentation of woven Bihuan (traditional Gamosa) to elders as a mark of deep reverence."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Til Pitha", "তিল পিঠা", "Crispy rolled rice cakes stuffed with toasted sesame seeds and jaggery."),
                TraditionalFood("Ghila Pitha", "ঘিলা পিঠা", "Fried rice and jaggery dumplings with a soft chewy center."),
                TraditionalFood("Laru (Narikol & Til)", "নাৰিকল আৰু তিলৰ লাৰু", "Sweet roasted coconut and sesame laddoos."),
                TraditionalFood("Doi-Chira with Gur & Jolpan", "দৈ-চিৰা আৰু গুৰ", "Flattened rice served with fresh creamy curd and organic date-palm/sugarcane jaggery.")
            ),
            regionalVariations = mapOf(
                "Bodo" to "Celebrated as Baishagu with Bagurumba dance and offering worship to Lord Bathou.",
                "Mishing" to "Celebrated with traditional Ali-Aye-Ligang spring customs.",
                "Tiwa & Karbi" to "Celebrated with village community dances and harvest feasting."
            ),
            visualMotif = "🌸🎋",
            isNationalHoliday = false,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_bhogali_bihu",
            name = "Bhogali Bihu (Magh Bihu)",
            devanagariName = "भोगाली बिहू (माघ बिहू)",
            regionalNames = mapOf("Assamese" to "ভোগালী বিহু / মাঘ বিহু"),
            gregorianDate2026 = LocalDate.of(2026, 1, 14),
            lunarDateString = "Magha Sankranti",
            durationDays = 2,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.HARVEST_AGRICULTURAL,
            season = RituSeason.SHISHIRA,
            shortSummary = "The festival of feasting, bonfires, and granaries full of winter harvest in Assam.",
            culturalSignificance = "Derived from 'Bhog' (feasting & enjoyment), Bhogali Bihu marks the end of the harvesting season when barns are brimming with paddy. The community gathers on Uruka night inside temporary bamboo huts called Bhelaghar.",
            traditionsAndRituals = listOf(
                "Uruka night: Community feasting in fields inside architectural thatch pavilions (Bhelaghar).",
                "Meji lighting: In the early morning mist, sacred towering conical bamboo structures (Meji) are set ablaze with offerings of pithas and betel nut to Agni.",
                "Traditional egg fights (Koni-juj) and buffalo fights in historical Ahom amphitheatres like Ahatguri."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Sunga Pitha", "চুঙা পিঠা", "Moist sticky Bora rice baked inside hollow bamboo stems over firewood."),
                TraditionalFood("Tekeli Pitha", "টেকেলী পিঠা", "Steamed rice flour cake flavored with grated coconut and cardamom."),
                TraditionalFood("Mah-Korai", "মাহ-কৰাই", "Crunchy roasted mixture of winter rice, black gram, sesame, and ginger.")
            ),
            regionalVariations = mapOf(
                "Barpeta & Lower Assam" to "Unique massive Meji architecture with community fireworks and devotional Borgeet chanting."
            ),
            visualMotif = "🔥🌾",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_kongali_bihu",
            name = "Kongali Bihu (Kati Bihu)",
            devanagariName = "कोंगाली बिहू (काति बिहू)",
            regionalNames = mapOf("Assamese" to "কঙালী বিহু / কাতি বিহু"),
            gregorianDate2026 = LocalDate.of(2026, 10, 18),
            lunarDateString = "Kati 1 (Autumnal Equinox Period)",
            durationDays = 1,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.SEASONAL_RITU,
            season = RituSeason.SHARAD,
            shortSummary = "A solemn and serene festival of prayer for crop protection, prosperity, and light during autumn.",
            culturalSignificance = "Unlike the joyous dance of Rongali or feast of Bhogali, Kati Bihu represents quiet hope ('Kongali' = scarce). Earthen lamps (Saki) are lit in emerald paddy fields to pray for pest-free blooming crops and guide ancestral souls.",
            traditionsAndRituals = listOf(
                "Akash Banti (Sky Lanterns): Earthen mustard-oil lamps hoisted on tall bamboo poles in the paddy fields.",
                "Tulsi Puja: Women clean courtyards and light earthen lamps at the foot of the sacred Tulsi plant.",
                "Recitation of protective mantras and folk verses asking pests to spare the tender paddy stalks."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Akash Saki Prasad", "প্ৰসাদ", "Simple offering of sprouted gram, ginger, fruits, and soaked rice.")
            ),
            visualMotif = "🪔🌾",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_ambubachi_mela",
            name = "Ambubachi Mela",
            devanagariName = "अम्बुबाची मेला",
            regionalNames = mapOf("Assamese" to "অম্বুবাচী মেলা"),
            gregorianDate2026 = LocalDate.of(2026, 6, 22),
            lunarDateString = "Ashadha (Mrigashirsha Nakshatra transition)",
            durationDays = 4,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam (Nilachal Hill, Guwahati)",
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.DEVOTIONAL_VRAT,
            season = RituSeason.GRISHMA,
            shortSummary = "Ancient Tantric festival at Kamakhya Temple celebrating the annual menstrual course and earth fertility of Goddess Kamakhya.",
            culturalSignificance = "Believed to be the Mahamudra of Mother Earth during the arrival of monsoon rains. The sanctum sanctorum of Kamakhya Temple remains closed for three days while Sadhus, Bauls, and Tantriks from across India congregate on the sacred Nilachal hill.",
            traditionsAndRituals = listOf(
                "Temple closure: For three days, no farming, tilling, or deity worship is performed.",
                "Raktavastra distribution: On the 4th day, the temple reopens with great festivity and devotees receive small pieces of red cloth (Angodak & Angabastra) as blessed relics."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Kamakhya Mahaprasad", "মহাপ্ৰসাদ", "Aromatic cooked khichdi and labra served in leaf platters.")
            ),
            visualMotif = "🌺🕉️",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_ali_aye_ligang",
            name = "Ali-Aye-Ligang",
            devanagariName = "अलि-आये-लिगांग",
            regionalNames = mapOf("Mishing" to "আলি-আই-লৃগাং"),
            gregorianDate2026 = LocalDate.of(2026, 2, 18),
            lunarDateString = "First Wednesday of Ginmur Polo (Phalguna)",
            durationDays = 5,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam (Mishing Community)",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.HARVEST_AGRICULTURAL,
            season = RituSeason.SHISHIRA,
            shortSummary = "Spring agro-festival of the Mishing tribe marking the ceremonial sowing of Ahu paddy seeds.",
            culturalSignificance = "'Ali' means root/seed, 'Aye' means fruit, and 'Ligang' means sowing. Sowing begins ritually in the east corner of the field by the family head followed by the energetic Gumrag Soman dance.",
            traditionsAndRituals = listOf(
                "Gumrag Soman: Mesmerizing synchronized dance to the beat of Dumdum (drum) and Pepa.",
                "Ceremonial seed planting: Offering boiled rice, eggs, and rice-beer to Karsing Kartak (Sun & Moon ancestors)."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Purang Apin", "পুৰাং আপিন", "Sticky rice wrapped in specially folded wild Tupid leaves (tora paat) and boiled."),
                TraditionalFood("Namsing", "নামচিং", "Traditional smoked fish delicacy prepared with wild herbs.")
            ),
            visualMotif = "🥁🌿",
            isMajorFestival = false
        ),

        FestivalModel(
            id = "fest_me_dam_me_phi",
            name = "Me-Dam-Me-Phi",
            devanagariName = "मे-दाम-मे-फी",
            regionalNames = mapOf("Tai-Ahom" to "মে-দাম-মে-ফি"),
            gregorianDate2026 = LocalDate.of(2026, 1, 31),
            lunarDateString = "31st January (Ahom Royal Calendar)",
            durationDays = 1,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Assam (Tai-Ahom)",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.FOLK_CULTURAL,
            season = RituSeason.SHISHIRA,
            shortSummary = "Tai-Ahom ancestor worship ceremony paying homage to departed forefathers and seeking blessings for universal peace.",
            culturalSignificance = "'Me' means offerings, 'Dam' means ancestors, and 'Phi' means gods. Rooted in the 600-year glorious history of the Ahom Kingdom that preserved Assam's sovereign identity.",
            traditionsAndRituals = listOf(
                "Dam-Poli: Erection of sacred decorative bamboo altars in traditional Tai architectural geometry.",
                "Chanting of ancient Ahom manuscripts by Deodhai and Bailung high priests."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Luklao & Khao-Mek", "খাও-মেক", "Sacred ceremonial rice preparation and traditional herbal beverage.")
            ),
            visualMotif = "🏮👑",
            isMajorFestival = false
        ),

        FestivalModel(
            id = "fest_hornbill_nagaland",
            name = "Hornbill Festival",
            devanagariName = "हॉर्नबिल महोत्सव",
            regionalNames = mapOf("Naga" to "Festival of Festivals"),
            gregorianDate2026 = LocalDate.of(2026, 12, 1),
            lunarDateString = "1st to 10th December",
            durationDays = 10,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Nagaland (Kisama Heritage Village)",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.FOLK_CULTURAL,
            season = RituSeason.HEMANTA,
            shortSummary = "Spectacular 'Festival of Festivals' showcasing the vibrant war chants, dances, weaves, and indigenous heritage of all 17 Naga tribes.",
            culturalSignificance = "Named after the revered Great Indian Hornbill, this cultural extravaganza unites the Angami, Ao, Konyak, Sumi, Lotha, Chakhesang and other tribes at the amphitheater of Kisama against the backdrop of Mount Japfü.",
            traditionsAndRituals = listOf(
                "Tribal morung exhibitions: Each tribe constructs traditional log houses with distinct architectural totems.",
                "Warrior dances: Display of ancient spears, dao, feathered headdresses, and synchronized war cries."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Naga Smoked Pork with Bamboo Shoot", "Naga Cuisine", "Rich slow-cooked smoked meat infused with fermented tender bamboo shoot and Raja Mircha (Bhut Jolokia)."),
                TraditionalFood("Galho", "Galho", "Wholesome comforting rice and leafy vegetable porridge.")
            ),
            visualMotif = "🪶🏹",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_chapchar_kut",
            name = "Chapchar Kut",
            devanagariName = "चापुचार कुट",
            regionalNames = mapOf("Mizo" to "Chapchar Kût"),
            gregorianDate2026 = LocalDate.of(2026, 3, 6),
            lunarDateString = "First Friday of March",
            durationDays = 2,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Mizoram",
            tradition = ReligiousTradition.TRIBAL_INDIGENOUS,
            category = FestivalCategory.HARVEST_AGRICULTURAL,
            season = RituSeason.VASANTA,
            shortSummary = "The premier joyous spring festival of the Mizo people celebrating the completion of clearing jhum jungle bamboo.",
            culturalSignificance = "Celebrated during the interval when cut bamboo dries under the warm March sun before burning. Entire towns dress in colorful Puanchei weaves to dance the famous Cheraw (bamboo dance).",
            traditionsAndRituals = listOf(
                "Cheraw Dance: Dancers step gracefully between rhythmic clapping bamboo poles.",
                "Chai Dance: Community singing in concentric circles with hands locked over shoulders."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Bai", "Bai", "Delicate steamed vegetable dish with local herbs, bamboo shoot, and pork."),
                TraditionalFood("Chhangban", "Chhangban", "Sticky rice flour steamed in fresh banana leaves.")
            ),
            visualMotif = "🎋🎶",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_yaoshang_manipur",
            name = "Yaoshang (Manipur Spring Festival)",
            devanagariName = "याओशांग",
            regionalNames = mapOf("Meitei" to "ꯌꯥꯎꯁꯪ (Yaoshang)"),
            gregorianDate2026 = LocalDate.of(2026, 3, 4),
            lunarDateString = "Phalguna Purnima (5 Days)",
            durationDays = 5,
            region = IndianRegion.NORTHEAST_ASSAM,
            specificState = "Manipur",
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.SEASONAL_RITU,
            season = RituSeason.VASANTA,
            shortSummary = "Manipur's premier 5-day spring festival blending traditional Vaishnavite devotion, sports tournaments, and Thabal Chongba moonlight dancing.",
            culturalSignificance = "Begins at sunset with the burning of the straw Yaoshang hut. It features indigenous sports in every Leikai (neighborhood) and romantic Thabal Chongba ('dancing in the moonlight') where boys and girls join hands.",
            traditionsAndRituals = listOf(
                "Yaoshang Mei Thaba: Lighting the thatched bamboo hut and carrying sacred ash.",
                "Thabal Chongba: Traditional circular folk dance in village squares under the bright full moon.",
                "Nakatheng: Children moving from house to house collecting small tokens for festive feasts."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Eromba", "Eromba", "Mashed boiled vegetables, fermented fish (Ngari), and king chili."),
                TraditionalFood("Singju", "Singju", "Crisp spicy herbal salad with lotus stem, cabbage, and roasted gram.")
            ),
            visualMotif = "🌕💃",
            isMajorFestival = true
        ),

        // ==========================================
        // PAN-INDIA & NORTH INDIA CELEBRATIONS
        // ==========================================
        FestivalModel(
            id = "fest_diwali",
            name = "Diwali (Deepavali)",
            devanagariName = "दीपावली (दिवाली)",
            regionalNames = mapOf(
                "Tamil" to "தீபாவளி",
                "Telugu" to "దీపావళి",
                "Kannada" to "ದೀಪಾವಳಿ",
                "Bengali" to "দীপাবলি / শ্যামা পূজা"
            ),
            gregorianDate2026 = LocalDate.of(2026, 11, 8),
            lunarDateString = "Kartika Amavasya",
            durationDays = 5,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.SHARAD,
            shortSummary = "The radiant Festival of Lights symbolizing the triumph of divine illumination over darkness, virtue over ignorance, and hope over despair.",
            culturalSignificance = "Commemorates Bhagavan Rama's victorious return to Ayodhya after 14 years of exile and the conquest over Ravana. In Eastern India, it coincides with the powerful midnight worship of Goddess Kali.",
            traditionsAndRituals = listOf(
                "Lighting clay diyas and decorative lanterns across terraces, courtyards, and thresholds.",
                "Grand evening Lakshmi-Ganesha Puja with gold coins, lotus flowers, and incense.",
                "Creation of vibrant geometric Rangoli and Kolam patterns at entryways.",
                "Exchange of artisanal mithai, dry fruits, and gifts with family and neighbors."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Kaju Katli", "काजू कतली", "Diamond-shaped silver-leafed cashew fudge."),
                TraditionalFood("Besan Ladoo", "बेसन के लड्डू", "Golden roasted gram flour spheres with cardamom and pure desi ghee."),
                TraditionalFood("Gujiya", "गुझिया", "Crisp golden pastry dumplings stuffed with sweetened mawa, saffron, and nuts."),
                TraditionalFood("Chakli & Murukku", "चकली", "Spiraled crunchy spiced rice and lentil savories.")
            ),
            regionalVariations = mapOf(
                "Bengal" to "Celebrated as Shyama Puja / Kali Puja with elaborate pandals.",
                "South India" to "Celebrated on Naraka Chaturdashi with early morning oil bath (Ganga Snanam).",
                "Punjab" to "Celebrated by Sikhs as Bandi Chhor Divas (Release of Guru Hargobind Ji)."
            ),
            visualMotif = "🪔✨",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_holi",
            name = "Holi (Festival of Colors)",
            devanagariName = "होली (रंगोत्सव)",
            regionalNames = mapOf(
                "Braj" to "लठमार होली",
                "Bengali" to "দোল যাত্রা (Dol Jatra)",
                "Odia" to "ଦୋଳ ପୂର୍ଣ୍ଣିମା"
            ),
            gregorianDate2026 = LocalDate.of(2026, 3, 4),
            lunarDateString = "Phalguna Purnima",
            durationDays = 2,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VASANTA,
            shortSummary = "The exuberant festival of colors, eternal love of Radha-Krishna, welcoming spring, and the burning of demonic ego (Holika).",
            culturalSignificance = "Holi breaks all social barriers with joyous showers of organic gulal (herbal colors), water play, laughter, and music.",
            traditionsAndRituals = listOf(
                "Holika Dahan: Community bonfire the night before to burn negativity and celebrate Prahlad's miraculous devotion.",
                "Rangwali Holi: Joyous smearing of fragrant herbal gulal and splashes of colored water.",
                "Embracing neighbors and resolving old resentments (Gale Milna)."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Thandai", "ठंडाई", "Cooling milk beverage infused with crushed almonds, rose petals, fennel, and saffron."),
                TraditionalFood("Mawa Gujiya", "मावा गुझिया", "Deep-fried crisp pastry parcels bursting with cardamom-scented khoya."),
                TraditionalFood("Dahi Vada", "दही वड़ा", "Fluffy lentil dumplings soaked in creamy yogurt with tangy tamarind chutney.")
            ),
            visualMotif = "🎨🌸",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_durga_puja",
            name = "Durga Puja (Sharadotsav)",
            devanagariName = "दुर्गा पूजा (शारदोत्सव)",
            regionalNames = mapOf(
                "Bengali" to "দুর্গাপূজা (শারদোৎসব)",
                "Assamese" to "দুৰ্গা পূজা",
                "Odia" to "ଦୁର୍ଗା ପୂଜା"
            ),
            gregorianDate2026 = LocalDate.of(2026, 10, 15),
            lunarDateString = "Ashvina Shukla Shashthi to Dashami",
            durationDays = 5,
            region = IndianRegion.EAST_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.SHARAD,
            shortSummary = "UNESCO Intangible Cultural Heritage celebration of Goddess Durga's homecoming and victory of Divine Mother over Mahishasura.",
            culturalSignificance = "Transforms Kolkata, Assam, and Bengal into a 24-hour open-air art gallery with monumental theme pandals, dhak drummers, and cultural performances.",
            traditionsAndRituals = listOf(
                "Mahalaya: Dawn invocation of the Goddess with Birendra Krishna Bhadra's legendary Chandi Path broadcast.",
                "Bodhon & Sandhi Puja: 108 lotus flowers and 108 clay lamps lit during the auspicious junction of Ashtami and Navami.",
                "Dhunuchi Naach: Ecstatic earthen incense burner dance to the intoxicating thunder of Dhak drums.",
                "Sindoor Khela & Visarjan: Married women offering vermilion on Vijayadashami before idol immersion."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Bhog Khichuri", "ভোগের খিচুড়ি", "Aromatic Gobindobhog rice and roasted moong dal khichuri cooked in pure ghee."),
                TraditionalFood("Labra", "লাবড়া", "Five-spice mixed seasonal vegetable stew."),
                TraditionalFood("Rosogolla & Sandesh", "রসগোল্লা ও সন্দেশ", "Silken cottage cheese confection steeped in sugar syrup or date-palm jaggery.")
            ),
            visualMotif = "🔱🥁",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_navratri_sharad",
            name = "Sharad Navratri",
            devanagariName = "शारदीय नवरात्रि",
            regionalNames = mapOf(
                "Gujarati" to "ગરબા નવરાત્રી",
                "Tamil" to "கொலு (Golu)"
            ),
            gregorianDate2026 = LocalDate.of(2026, 10, 11),
            lunarDateString = "Ashvina Shukla Pratipada to Navami",
            durationDays = 9,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.DEVOTIONAL_VRAT,
            season = RituSeason.SHARAD,
            shortSummary = "Nine divine nights dedicated to the nine manifestations of Shakti (Navadurga) with fasting, prayer, and Garba dance.",
            culturalSignificance = "Worships Shailaputri, Brahmacharini, Chandraghanta, Kushmanda, Skandamata, Katyayani, Kalaratri, Mahagauri, and Siddhidatri.",
            traditionsAndRituals = listOf(
                "Ghatasthapana: Installing the sacred water pot and sowing holy barley seeds.",
                "Fasting on Satvik foods (Kuttu, Singharo, Sabudana) and reading the Devi Mahatmyam.",
                "Gujarat Garba & Dandiya Raas: Millions dancing in synchronized circles around the earthen Garbha lamp.",
                "South Indian Bommai Golu: Tiered wooden stepped display of heritage mythological figurines."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Sabudana Khichdi", "साबूदाना खिचड़ी", "Tapioca pearls tempered with roasted peanuts, cumin, and green chilies."),
                TraditionalFood("Kuttu Puri & Aloo", "कुट्टू की पूरी", "Buckwheat flour flatbreads with rock-salt potato curry.")
            ),
            visualMotif = "💃🪘",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_dussehra",
            name = "Dussehra (Vijayadashami)",
            devanagariName = "दशहरा (विजयादशमी)",
            regionalNames = mapOf(
                "Kannada" to "ಮೈಸೂರು ದಸರಾ",
                "Telugu" to "విజయదశమి"
            ),
            gregorianDate2026 = LocalDate.of(2026, 10, 20),
            lunarDateString = "Ashvina Shukla Dashami",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.SHARAD,
            shortSummary = "Celebration of the triumph of virtue over vice — Lord Rama's victory over Ravana and Durga's slaying of the demon Mahishasura.",
            culturalSignificance = "Marks the culmination of Ramlila plays across North India and the world-famous Mysuru Dasara royal elephant procession.",
            traditionsAndRituals = listOf(
                "Ravana Dahan: Burning towering effigies of Ravana, Kumbhakarna, and Meghnada with fireworks.",
                "Shami Puja & Ayudha Puja: Blessing tools of trade, books, musical instruments, and vehicles.",
                "Mysuru Jumboo Savari: 750 kg golden howdah carrying Chamundeshwari mounted on decorated royal elephant."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Jalebi & Fafda", "जलेबी फाफड़ा", "Crispy gram flour ribbons paired with hot saffron-syrup jalebis.")
            ),
            visualMotif = "🏹👑",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_ganesh_chaturthi",
            name = "Ganesh Chaturthi (Vinayaka Chavithi)",
            devanagariName = "गणेश चतुर्थी",
            regionalNames = mapOf(
                "Marathi" to "गणेशोत्सव",
                "Telugu" to "వినాయక చవితి",
                "Tamil" to "விநாயகர் சதுர்த்தி"
            ),
            gregorianDate2026 = LocalDate.of(2026, 9, 14),
            lunarDateString = "Bhadrapada Shukla Chaturthi",
            durationDays = 10,
            region = IndianRegion.WEST_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VARSHA,
            shortSummary = "The grand festival welcoming Lord Ganesha, the harbinger of wisdom, prosperity, and remover of all obstacles.",
            culturalSignificance = "Transformed by Lokmanya Tilak in 1893 into a powerful public movement uniting people across backgrounds.",
            traditionsAndRituals = listOf(
                "Prana Pratishtha: Consecrating eco-friendly clay Ganesha murtis with 21 durva grass blades and red hibiscus.",
                "Dhol Tasha Pathak: Energetic drum ensembles performing across Maharashtra.",
                "Ganesh Visarjan on Anant Chaturdashi with emotional chants of 'Ganpati Bappa Morya, Pudhchya Varshi Lavkar Ya'."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Ukadiche Modak", "उकडीचे मोदक", "Delicate steamed rice flour dumplings filled with grated coconut, jaggery, and nutmeg."),
                TraditionalFood("Puran Poli", "पुरण पोळी", "Sweet flatbread stuffed with spiced Bengal gram and jaggery filling.")
            ),
            visualMotif = "🐘🕉️",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_krishna_janmashtami",
            name = "Krishna Janmashtami",
            devanagariName = "श्रीकृष्ण जन्माष्टमी",
            regionalNames = mapOf(
                "Marathi" to "गोकुळाष्टमी / दही हंडी",
                "Tamil" to "கிருஷ்ண ஜெயந்தி"
            ),
            gregorianDate2026 = LocalDate.of(2026, 9, 4),
            lunarDateString = "Bhadrapada Krishna Ashtami (Rohini Nakshatra)",
            durationDays = 2,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VARSHA,
            shortSummary = "Celebration of the midnight advent of Lord Krishna, the embodiment of divine love, wisdom, and the Gita.",
            culturalSignificance = "Observed with midnight fasts, elaborate jhula (cradle) decorations in temples, and thrilling Dahi Handi human pyramids.",
            traditionsAndRituals = listOf(
                "Nishita Kaal Puja: Midnight bathing (Abhisheka) of Bal Gopal with Panchamrit.",
                "Drawing small rice-flour baby footprints from the entrance to the puja room.",
                "Dahi Handi: Multi-tiered human pyramids breaking curd pots suspended high above the streets."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Makhan Mishri", "माखन मिश्री", "Freshly churned white butter mixed with crystalline rock sugar."),
                TraditionalFood("Panjiri & Dhaniya Prasad", "धनिया पंजीरी", "Roasted coriander seed flour blended with ghee, makhana, and dry fruits.")
            ),
            visualMotif = "🪈🦚",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_maha_shivratri",
            name = "Maha Shivratri",
            devanagariName = "महाशिवरात्रि",
            regionalNames = mapOf(
                "Tamil" to "மகா சிவராத்திரி",
                "Kashmiri" to "हेराथ (Herath)"
            ),
            gregorianDate2026 = LocalDate.of(2026, 2, 15),
            lunarDateString = "Phalguna Krishna Chaturdashi (Nishita Kaal)",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.DEVOTIONAL_VRAT,
            season = RituSeason.SHISHIRA,
            shortSummary = "The Great Night of Shiva — the cosmic dance of creation and the sacred marriage of Shiva and Parvati.",
            culturalSignificance = "Devotees observe an all-night vigil (Jagaran) and fast, meditating on the supreme consciousness.",
            traditionsAndRituals = listOf(
                "Char Prahar Puja: Four rounds of sacred Abhisheka performed throughout the night using milk, curd, honey, sugarcane juice, and water.",
                "Offering sacred trifoliate Bilva leaves and chanting the Maha Mrityunjaya Mantra.",
                "All-night devotional music and meditation gatherings."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Bhang Thandai & Kheer", "महाशिवरात्रि प्रसाद", "Cooling saffron-almond milk beverage and samak rice pudding.")
            ),
            visualMotif = "🔱🌙",
            isMajorFestival = true
        ),

        // ==========================================
        // SOUTH INDIA CELEBRATIONS
        // ==========================================
        FestivalModel(
            id = "fest_pongal",
            name = "Thai Pongal & Makar Sankranti",
            devanagariName = "पोंगल एवं मकर संक्रांति",
            regionalNames = mapOf(
                "Tamil" to "தைப்பொங்கல்",
                "Telugu" to "సంక్రాంతి",
                "Kannada" to "ಮಕರ ಸಂಕ್ರಾಂತಿ"
            ),
            gregorianDate2026 = LocalDate.of(2026, 1, 14),
            lunarDateString = "Thai 1 / Makara Sankranti (Solar Ingress)",
            durationDays = 4,
            region = IndianRegion.SOUTH_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.HARVEST_AGRICULTURAL,
            season = RituSeason.SHISHIRA,
            shortSummary = "Four-day Tamil harvest festival thanking the Sun God, Mother Nature, and farm cattle for bounty and prosperity.",
            culturalSignificance = "Celebrated across 4 days: Bhogi Pongal (discarding the old), Surya Pongal (Sun offering), Mattu Pongal (cattle veneration), and Kaanum Pongal (family outings).",
            traditionsAndRituals = listOf(
                "Boiling freshly harvested rice and jaggery in decorated earthen pots outdoors until it boils over, shouting 'Pongalo Pongal!'.",
                "Drawing elaborate Kolam artwork with rice flour at dawn.",
                "Mattu Pongal: Painting horns of cattle and garlanding bulls."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Sakkarai Pongal", "சர்க்கரைப் பொங்கல்", "Sweet rice, moong dal, and jaggery porridge enriched with ghee, cashews, and raisins."),
                TraditionalFood("Ven Pongal", "வெண் பொங்கல்", "Savory rice and lentil mash seasoned with black pepper, ginger, and curry leaves.")
            ),
            visualMotif = "🌾🏺",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_onam",
            name = "Onam (Thiruvonam)",
            devanagariName = "ओणम (तिरुवोणम)",
            regionalNames = mapOf("Malayalam" to "ഓണം (തിരുവോണം)"),
            gregorianDate2026 = LocalDate.of(2026, 8, 26),
            lunarDateString = "Chingam (Thiruvonam Asterism)",
            durationDays = 10,
            region = IndianRegion.SOUTH_INDIA,
            specificState = "Kerala",
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.HARVEST_AGRICULTURAL,
            season = RituSeason.VARSHA,
            shortSummary = "Kerala's harvest and cultural carnival welcoming the annual return of the righteous King Mahabali.",
            culturalSignificance = "Celebrated across 10 days starting from Atham to Thiruvonam, bringing together people of all faiths in Kerala.",
            traditionsAndRituals = listOf(
                "Pookkalam: Creating floral carpets in geometric concentric patterns outside every home.",
                "Onasadya: Grand nine-course vegetarian feast served on fresh plantain leaves featuring over 26 authentic delicacies.",
                "Vallam Kali: Snake boat races on the Pamba river with hundreds of synchronized oarsmen chanting Vanchipattu.",
                "Pulikali: Colorful tiger dance by performers painted in bright stripes of yellow and black."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Onasadya & Avial", "ഓണസദ്യ", "Grand plantain-leaf banquet with Avial, Sambar, Olan, Thoran, and Payasam."),
                TraditionalFood("Palada Pradhaman", "പാലട പ്രഥമൻ", "Rich creamy dessert made with rice flakes, milk, and sugar slowly simmered to pink perfection.")
            ),
            visualMotif = "🌸🚣",
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_ugadi",
            name = "Ugadi / Gudi Padwa",
            devanagariName = "युगादि / गुड़ी पड़वा",
            regionalNames = mapOf(
                "Telugu" to "ఉగాది",
                "Kannada" to "ಯುಗಾದಿ",
                "Marathi" to "गुढीपाडवा"
            ),
            gregorianDate2026 = LocalDate.of(2026, 3, 20),
            lunarDateString = "Chaitra Shukla Pratipada",
            durationDays = 1,
            region = IndianRegion.SOUTH_INDIA,
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.NEW_YEAR,
            season = RituSeason.VASANTA,
            shortSummary = "The Deccan and Western New Year marking the cosmic day Lord Brahma began the creation of the universe.",
            culturalSignificance = "Marks the commencement of the new astronomical cycle and the reading of the annual forecast (Panchanga Sravanam).",
            traditionsAndRituals = listOf(
                "Panchanga Sravanam: Listening to the predictions for rains, crops, and economy for the upcoming year.",
                "Hoisting the Gudi: In Maharashtra, a silk cloth topped with an inverted silver/copper pot and neem leaves is hoisted outside homes.",
                "Tasting Ugadi Pachadi: A symbolic dish combining all 6 fundamental tastes of human life."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Ugadi Pachadi", "ఉగాది పచ్చడి", "Sacred concoction with neem flowers (bitter), raw mango (tangy), jaggery (sweet), chili (spicy), tamarind (sour), and salt."),
                TraditionalFood("Holige / Obbattu", "ಹೋಳಿಗೆ", "Sweet stuffed flatbread made with chana dal, jaggery, and nutmeg.")
            ),
            visualMotif = "🚩🌿",
            isMajorFestival = true
        ),

        // ==========================================
        // ISLAMIC CELEBRATIONS IN INDIA
        // ==========================================
        FestivalModel(
            id = "fest_eid_ul_fitr",
            name = "Eid ul-Fitr",
            devanagariName = "ईद-उल-फ़ितर (मीठी ईद)",
            regionalNames = mapOf("Urdu" to "عید الفطر"),
            gregorianDate2026 = LocalDate.of(2026, 3, 20),
            lunarDateString = "Shawwal 1 (Sighting of Crescent Moon)",
            durationDays = 2,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.ISLAMIC,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VASANTA,
            shortSummary = "The joyous culmination of the holy month of Ramadan, marked by charitable giving, prayers, and celebratory sweets.",
            culturalSignificance = "A festival of spiritual renewal, brotherhood, gratitude, and communal harmony across India.",
            traditionsAndRituals = listOf(
                "Chaand Raat: Gazing at the delicate silver crescent moon marking the end of fasting.",
                "Zakat al-Fitr: Mandatory charitable giving to ensure all community members partake in festive joy.",
                "Congregational morning prayers at grand historic Eidgahs (e.g. Jama Masjid Delhi, Nakhoda Masjid Kolkata).",
                "Warm hugs (Eid Mubarak) and exchanging Eidi gifts with elders and children."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Sheer Khurma", "شیر خورمہ", "Rich dessert of fine roasted vermicelli cooked in milk, dates, saffron, pistachios, and almonds."),
                TraditionalFood("Zafrani Mutton Biryani", "بریانی", "Layered fragrant basmati rice slow-cooked (Dum) with tender meat and whole spices.")
            ),
            visualMotif = "🌙🕌",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_eid_al_adha",
            name = "Eid al-Adha (Bakrid)",
            devanagariName = "ईद-अल-अज़हा (बकरीद)",
            regionalNames = mapOf("Urdu" to "عید الاضحیٰ"),
            gregorianDate2026 = LocalDate.of(2026, 5, 27),
            lunarDateString = "Dhu al-Hijjah 10",
            durationDays = 2,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.ISLAMIC,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.GRISHMA,
            shortSummary = "The Festival of Sacrifice honoring Prophet Ibrahim's supreme devotion and submission to God's command.",
            culturalSignificance = "Coincides with the completion of the annual Hajj pilgrimage. Emphasizes selflessness, compassion, and sharing meals.",
            traditionsAndRituals = listOf(
                "Special morning Eid prayer at open prayer grounds.",
                "Ritual Qurbani and dividing the meat into three equal portions: for family, friends, and the underprivileged."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Mutton Korma & Sheermal", "قورمہ", "Aromatic slow-braised curry paired with saffron-flavored flatbread.")
            ),
            visualMotif = "🕋✨",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        // ==========================================
        // SIKH, BUDDHIST & JAIN CELEBRATIONS
        // ==========================================
        FestivalModel(
            id = "fest_guru_nanak_jayanti",
            name = "Guru Nanak Jayanti (Gurpurab)",
            devanagariName = "गुरु नानक जयंती (प्रकाश पर्व)",
            regionalNames = mapOf("Punjabi" to "ਗੁਰੂ ਨਾਨਕ ਪ੍ਰਕਾਸ਼ ਗੁਰਪੁਰਬ"),
            gregorianDate2026 = LocalDate.of(2026, 11, 24),
            lunarDateString = "Kartika Purnima",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.SIKH,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.SHARAD,
            shortSummary = "Birth anniversary of Guru Nanak Dev Ji, founder of Sikhism, who taught oneness of humanity, selfless service, and truthful living.",
            culturalSignificance = "Celebrated with deep devotion at the Golden Temple (Harmandir Sahib) and Gurdwaras worldwide with illuminated sarovars and 48-hour continuous scriptural recitation.",
            traditionsAndRituals = listOf(
                "Akhand Path: Continuous uninterrupted reading of the Guru Granth Sahib over 48 hours.",
                "Nagar Kirtan: Grand religious procession led by the Panj Pyare carrying the Nishan Sahib.",
                "Guru ka Langar: Free egalitarian community kitchen serving thousands of people sitting together in pangat."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Karah Parshad", "ਕੜਾਹ ਪ੍ਰਸਾਦ", "Sacred sanctified offering prepared with equal parts whole wheat flour, pure desi ghee, sugar, and water.")
            ),
            visualMotif = "☬🪔",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_buddha_purnima",
            name = "Buddha Purnima (Vesak)",
            devanagariName = "बुद्ध पूर्णिमा (वेसाक)",
            regionalNames = mapOf("Pali" to "विसाख पुण्णमी"),
            gregorianDate2026 = LocalDate.of(2026, 5, 1),
            lunarDateString = "Vaishakha Purnima",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.BUDDHIST,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VASANTA,
            shortSummary = "Commemorates the Thrice-Blessed Day: the birth, supreme enlightenment (Bodhi), and Mahaparinirvana of Gautama Buddha.",
            culturalSignificance = "Centered at Mahabodhi Temple in Bodh Gaya, Sarnath, Kushinagar, and Himalayan monasteries in Ladakh and Tawang.",
            traditionsAndRituals = listOf(
                "Meditation under the sacred Bodhi tree and circumambulation of stupas.",
                "Pouring fragrant water over the roots of the Bodhi tree and lighting butter lamps.",
                "Practicing Ahimsa, freeing captive birds, and serving pure vegetarian food."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Kheer (Payasa)", "क्षीर", "Sweetened rice pudding honoring Sujata's historic offering to the Buddha before enlightenment.")
            ),
            visualMotif = "☸️🪷",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_mahavir_jayanti",
            name = "Mahavir Jayanti",
            devanagariName = "महावीर जयंती",
            regionalNames = mapOf("Prakrit" to "महावीर जयन्ती"),
            gregorianDate2026 = LocalDate.of(2026, 3, 31),
            lunarDateString = "Chaitra Shukla Trayodashi",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.JAIN,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.VASANTA,
            shortSummary = "Birth anniversary of Bhagavan Mahavira, 24th Tirthankara, who established the core tenets of Ahimsa (Non-violence), Satya, and Anekantavada.",
            culturalSignificance = "Celebrated by Digambara and Shvetambara communities through devotional processions, temple Abhishekams, and philanthropic acts.",
            traditionsAndRituals = listOf(
                "Rath Yatra: Sacred chariot procession carrying the idol of Bhagavan Mahavira.",
                "Abhisheka with fragrant waters and milk accompanied by devotional stotras.",
                "Donations to hospitals, animal shelters (Gaushalas), and charitable causes."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Jain Satvik Sweets", "मिठाई", "Delicacies prepared strictly following Jain dietary ethics without root vegetables or honey.")
            ),
            visualMotif = "✋🕊️",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        // ==========================================
        // CHRISTIAN & NATIONAL CELEBRATIONS
        // ==========================================
        FestivalModel(
            id = "fest_christmas",
            name = "Christmas",
            devanagariName = "बड़ा दिन (क्रिसमस)",
            regionalNames = mapOf(
                "Konkani" to "नाताळ",
                "Malayalam" to "ക്രിസ്മസ്"
            ),
            gregorianDate2026 = LocalDate.of(2026, 12, 25),
            lunarDateString = "25th December",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.CHRISTIAN,
            category = FestivalCategory.MAJOR_FESTIVAL,
            season = RituSeason.HEMANTA,
            shortSummary = "Celebration of the birth of Jesus Christ, marked across India by midnight masses, glowing star lanterns, and cultural feasts.",
            culturalSignificance = "Celebrated with magnificent warmth in Goa, Kerala, Meghalaya, Nagaland, Mizoram, Mumbai, and Kolkata with colonial & regional architectural lighting.",
            traditionsAndRituals = listOf(
                "Midnight Mass at historic basilicas (e.g. Se Cathedral Goa, Santa Cruz Cochin, St. Paul's Kolkata).",
                "Hanging large illuminated paper star lanterns outside homes.",
                "Carol singing processions through neighborhood streets."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Kuswar Sweets & Bebinca", "Bebinca", "Multi-layered Goan coconut milk cake, Rose Cookies, and rich Plum Cake.")
            ),
            visualMotif = "⭐🎄",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_independence_day",
            name = "Independence Day",
            devanagariName = "स्वतंत्रता दिवस",
            regionalNames = mapOf("Hindi" to "१५ अगस्त स्वतंत्रता दिवस"),
            gregorianDate2026 = LocalDate.of(2026, 8, 15),
            lunarDateString = "15th August",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.SECULAR_NATIONAL,
            category = FestivalCategory.NATIONAL_COMMEMORATIVE,
            season = RituSeason.VARSHA,
            shortSummary = "Commemorates India's freedom from British colonial rule in 1947, celebrated with flag hoistings and patriotic pride across the nation.",
            culturalSignificance = "National flag unfurled from the ramparts of Red Fort in New Delhi, accompanied by kite flying across North India.",
            traditionsAndRituals = listOf(
                "National Flag hoisting ceremonies in schools, offices, and residential communities.",
                "Singing of the National Anthem (Jana Gana Mana) and patriotic songs.",
                "Tricolor kite flying competitions from rooftops."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Tiranga Sweets", "तिरंगा मिठाई", "Three-colored Barfi and Dhokla representing Saffron, White, and Green.")
            ),
            visualMotif = "🇮🇳🕊️",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_republic_day",
            name = "Republic Day",
            devanagariName = "गणतंत्र दिवस",
            regionalNames = mapOf("Hindi" to "२६ जनवरी गणतंत्र दिवस"),
            gregorianDate2026 = LocalDate.of(2026, 1, 26),
            lunarDateString = "26th January",
            durationDays = 1,
            region = IndianRegion.ALL_INDIA,
            tradition = ReligiousTradition.SECULAR_NATIONAL,
            category = FestivalCategory.NATIONAL_COMMEMORATIVE,
            season = RituSeason.SHISHIRA,
            shortSummary = "Celebrates the date on which the Constitution of India came into effect in 1950, turning India into a sovereign democratic republic.",
            culturalSignificance = "Marked by the spectacular Kartavya Path parade in New Delhi showcasing military prowess and cultural tableaux from all states.",
            traditionsAndRituals = listOf(
                "Grand Republic Day Parade on Kartavya Path with regional state tableaux and tribal dance troupes.",
                "Presidential Address to the nation honoring bravery award recipients."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Jalebi & Khasta Kachori", "जलेबी कचौरी", "Traditional morning Republic Day breakfast across Indian towns.")
            ),
            visualMotif = "🇮🇳🏛️",
            isNationalHoliday = true,
            isMajorFestival = true
        ),

        FestivalModel(
            id = "fest_chhath_puja",
            name = "Chhath Puja",
            devanagariName = "छठ पूजा (सूर्य षष्ठी)",
            regionalNames = mapOf("Bhojpuri" to "छठी माई के बरत"),
            gregorianDate2026 = LocalDate.of(2026, 11, 14),
            lunarDateString = "Kartika Shukla Shashthi",
            durationDays = 4,
            region = IndianRegion.EAST_INDIA,
            specificState = "Bihar, Jharkhand, UP",
            tradition = ReligiousTradition.HINDU,
            category = FestivalCategory.DEVOTIONAL_VRAT,
            season = RituSeason.HEMANTA,
            shortSummary = "The ancient rigorous Vedic solar worship festival dedicated to Lord Surya and Chhathi Maiya along river ghats.",
            culturalSignificance = "Unique in honoring both the setting sun (Sandhya Arghya) and rising sun (Usha Arghya) with zero mediation of priests.",
            traditionsAndRituals = listOf(
                "Nahay Khay (Day 1) and Kharna (Day 2): Fasting and purification.",
                "Sandhya Arghya (Day 3): Devotees standing waist-deep in water offering holy water and soop baskets to the setting sun.",
                "Usha Arghya (Day 4): Final morning offering to the rising sun, followed by breaking the 36-hour nirjala fast."
            ),
            traditionalFoods = listOf(
                TraditionalFood("Thekua", "ठेकुआ", "Traditional crispy holy cookie made with whole wheat flour, ghee, jaggery, and crushed fennel, deep-fried in pure ghee.")
            ),
            visualMotif = "🌅🎋",
            isMajorFestival = true
        )
    )
}
