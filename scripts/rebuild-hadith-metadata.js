#!/usr/bin/env node
/**
 * rebuild-hadith-metadata.js
 * 
 * Reads every hadiths.json inside src/data/hadith-collections/<slug>/
 * and generates a proper metadata.json with accurate book lists derived
 * from the actual hadith data.  Also handles collections that only have
 * a single book-1.json instead of hadiths.json.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COLLECTIONS_DIR = path.resolve(__dirname, "../src/data/hadith-collections");

// Curated collection profiles we know about
const PROFILES = {
    bukhari: {
        title: "Sahih al-Bukhari",
        arabicTitle: "صحيح البخاري",
        author: "Imam Muhammad ibn Ismail al-Bukhari",
        death: "256 AH / 870 CE",
        description: "The most authentic collection of Hadith after the Quran.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "194-256 AH",
    },
    muslim: {
        title: "Sahih Muslim",
        arabicTitle: "صحيح مسلم",
        author: "Imam Muslim ibn al-Hajjaj",
        death: "261 AH / 875 CE",
        description: "Second most authentic collection of Hadith.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "204-261 AH",
    },
    tirmidhi: {
        title: "Sunan al-Tirmidhi",
        arabicTitle: "سنن الترمذي",
        author: "Imam Abu Isa al-Tirmidhi",
        death: "279 AH / 892 CE",
        description: "Collection containing authentic, good, and weak hadith with scholarly commentary.",
        authenticity: "Hasan (Good)",
        compilerPeriod: "209-279 AH",
    },
    abudawud: {
        title: "Sunan Abu Dawud",
        arabicTitle: "سنن أبي داود",
        author: "Imam Abu Dawud al-Sijistani",
        death: "275 AH / 889 CE",
        description: "One of the six major Hadith collections focusing on Islamic jurisprudence.",
        authenticity: "Hasan (Good)",
        compilerPeriod: "202-275 AH",
    },
    nasai: {
        title: "Sunan al-Nasa'i",
        arabicTitle: "سنن النسائي",
        author: "Imam al-Nasa'i",
        death: "303 AH / 915 CE",
        description: "Collection known for detailed chains of narration and strong authenticity standards.",
        authenticity: "Hasan (Good)",
        compilerPeriod: "215-303 AH",
    },
    ibnmajah: {
        title: "Sunan Ibn Majah",
        arabicTitle: "سنن ابن ماجه",
        author: "Imam Ibn Majah",
        death: "273 AH / 887 CE",
        description: "One of the six canonical Hadith collections.",
        authenticity: "Hasan (Good)",
        compilerPeriod: "209-273 AH",
    },
    malik: {
        title: "Muwatta Malik",
        arabicTitle: "موطأ مالك",
        author: "Imam Malik ibn Anas",
        death: "179 AH / 795 CE",
        description: "Early collection of Hadith and legal rulings compiled in Medina.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "93-179 AH",
    },
    riyadussalihin: {
        title: "Riyad us-Salihin",
        arabicTitle: "رياض الصالحين",
        author: "Imam al-Nawawi",
        death: "676 AH / 1277 CE",
        description: "Collection focusing on spirituality, character, and daily Islamic practice.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "631-676 AH",
    },
    mishkat: {
        title: "Mishkat al-Masabih",
        arabicTitle: "مشكاة المصابيح",
        author: "Imam al-Khatib al-Tabrizi",
        death: "741 AH",
        description: "A comprehensive hadith collection compiled from multiple authentic sources.",
        authenticity: "Varied",
        compilerPeriod: "",
    },
    bulugh: {
        title: "Bulugh al-Maram",
        arabicTitle: "بلوغ المرام",
        author: "Imam Ibn Hajar al-Asqalani",
        death: "852 AH / 1449 CE",
        description: "Collection of hadith pertaining to jurisprudence rulings.",
        authenticity: "Varied",
        compilerPeriod: "773-852 AH",
    },
    darimi: {
        title: "Sunan al-Darimi",
        arabicTitle: "سنن الدارمي",
        author: "Imam Abdullah ibn Abd al-Rahman al-Darimi",
        death: "255 AH / 869 CE",
        description: "Early hadith collection organized by subject matter.",
        authenticity: "Varied",
        compilerPeriod: "181-255 AH",
    },
    forty: {
        title: "40 Hadith Nawawi",
        arabicTitle: "الأربعون النووية",
        author: "Imam al-Nawawi",
        death: "676 AH / 1277 CE",
        description: "Forty essential hadith covering the foundations of Islam.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "631-676 AH",
    },
    hisn: {
        title: "Hisnul Muslim",
        arabicTitle: "حصن المسلم",
        author: "Sa'id bin Ali bin Wahf Al-Qahtani",
        death: "",
        description: "Fortress of the Muslim - Collection of daily supplications and remembrances.",
        authenticity: "Sahih (Authentic)",
        compilerPeriod: "",
    },
    shamail: {
        title: "Shamail Muhammadiyah",
        arabicTitle: "الشمائل المحمدية",
        author: "Imam al-Tirmidhi",
        death: "279 AH / 892 CE",
        description: "Description of the Prophet Muhammad's appearance, character, and way of life.",
        authenticity: "Hasan (Good)",
        compilerPeriod: "209-279 AH",
    },
    adab: {
        title: "Al-Adab al-Mufrad",
        arabicTitle: "الأدب المفرد",
        author: "Imam al-Bukhari",
        death: "256 AH / 870 CE",
        description: "Collection of hadith focused on Islamic manners and etiquette.",
        authenticity: "Varied",
        compilerPeriod: "194-256 AH",
    },
    ahmad: {
        title: "Musnad Ahmad",
        arabicTitle: "مسند أحمد بن حنبل",
        author: "Imam Ahmad ibn Hanbal",
        death: "241 AH / 855 CE",
        description: "Large collection organized primarily by companion narrators.",
        authenticity: "Varied",
        compilerPeriod: "164-241 AH",
    },
};

function titleFromSlug(slug) {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function processCollection(slug, collectionDir) {
    // Try hadiths.json first, then book-1.json
    let hadiths = [];
    const hadithsPath = path.join(collectionDir, "hadiths.json");
    const book1Path = path.join(collectionDir, "book-1.json");

    if (fs.existsSync(hadithsPath)) {
        try {
            hadiths = JSON.parse(fs.readFileSync(hadithsPath, "utf8"));
        } catch (e) {
            console.warn(`  ⚠️  Failed to parse ${hadithsPath}: ${e.message}`);
            return null;
        }
    } else if (fs.existsSync(book1Path)) {
        try {
            hadiths = JSON.parse(fs.readFileSync(book1Path, "utf8"));
        } catch (e) {
            console.warn(`  ⚠️  Failed to parse ${book1Path}: ${e.message}`);
            return null;
        }
    } else {
        console.warn(`  ⚠️  No hadiths.json or book-1.json in ${slug}`);
        return null;
    }

    if (!Array.isArray(hadiths) || hadiths.length === 0) {
        console.warn(`  ⚠️  Empty or invalid hadiths array in ${slug}`);
        return null;
    }

    // Build book map from actual data
    const bookMap = new Map();
    for (const h of hadiths) {
        const bookNum = String(h.bookNumber ?? "1");
        if (!bookMap.has(bookNum)) {
            bookMap.set(bookNum, {
                number: bookNum,
                name: h.bookName || `Book ${bookNum}`,
                arabicName: "",
                hadithCount: 0,
            });
        }
        bookMap.get(bookNum).hadithCount++;
    }

    // Sort books numerically
    const books = Array.from(bookMap.values()).sort((a, b) => {
        const aN = parseInt(a.number, 10);
        const bN = parseInt(b.number, 10);
        if (isNaN(aN) || isNaN(bN)) return a.number.localeCompare(b.number);
        return aN - bN;
    });

    const profile = PROFILES[slug] || {};

    const metadata = {
        name: slug,
        title: profile.title || titleFromSlug(slug),
        arabicTitle: profile.arabicTitle || "",
        author: profile.author || "",
        death: profile.death || "",
        description: profile.description || `Hadith collection: ${titleFromSlug(slug)}`,
        authenticity: profile.authenticity || "",
        compilerPeriod: profile.compilerPeriod || "",
        totalHadith: hadiths.length,
        totalBooks: books.length,
        books,
    };

    return metadata;
}

function main() {
    console.log("🔄 Rebuilding Hadith metadata from actual data...\n");

    const entries = fs.readdirSync(COLLECTIONS_DIR, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    let processedCount = 0;
    let skippedCount = 0;
    // Track which slugs have duplicates (e.g., abudawud vs abu-dawud)
    const processedSlugs = [];

    for (const slug of dirs.sort()) {
        const fullDir = path.join(COLLECTIONS_DIR, slug);
        process.stdout.write(`  📖 Processing ${slug}... `);

        const metadata = processCollection(slug, fullDir);
        if (!metadata) {
            skippedCount++;
            console.log("SKIPPED");
            continue;
        }

        const outPath = path.join(fullDir, "metadata.json");
        fs.writeFileSync(outPath, JSON.stringify(metadata, null, 2), "utf8");
        console.log(`✅ ${metadata.totalHadith} hadith in ${metadata.totalBooks} books`);
        processedSlugs.push(slug);
        processedCount++;
    }

    console.log(`\n✅ Processed: ${processedCount} | Skipped: ${skippedCount}`);
    console.log(`\nCollections with data: ${processedSlugs.join(", ")}`);
}

main();
