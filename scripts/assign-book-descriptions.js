import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METADATA_FILES_DIR = path.resolve(__dirname, '../src/data/hadith-collections');

// Dictionary of common book topics and their descriptions
const BOOK_DESCRIPTIONS = {
    revelation: "Hadiths detailing the initial encounters of Prophet Muhammad (ﷺ) with the Angel Jibril and the beginning of divine revelation.",
    belief: "Fundamental teachings on faith (Iman), its branches, and matters of belief in Allah, His Angels, Books, Messengers, and the Last Day.",
    faith: "Fundamental teachings on faith (Iman), its branches, and matters of belief in Allah, His Angels, Books, Messengers, and the Last Day.",
    knowledge: "The virtues of seeking Islamic knowledge, the etiquette of a student, and the responsibility of scholars to convey the truth.",
    ablution: "Rulings and methods of physical purification (Wudu), illustrating the spiritual and physical cleanliness required for prayer.",
    wudu: "Rulings and methods of physical purification (Wudu), illustrating the spiritual and physical cleanliness required for prayer.",
    purification: "Comprehensive rulings on Taharah, including all forms of ritual purity required for acts of worship.",
    bathing: "Guidelines concerning the major ritual bath (Ghusl) and the circumstances requiring it.",
    ghusl: "Guidelines concerning the major ritual bath (Ghusl) and the circumstances requiring it.",
    menstruation: "Islamic jurisprudence regarding menstruation (Hayd) and postnatal bleeding, detailing their effect on worship.",
    menstrual: "Islamic jurisprudence regarding menstruation (Hayd) and postnatal bleeding, detailing their effect on worship.",
    tayammum: "The rules for dry ablution using clean earth or dust when water is unavailable or using it is harmful.",
    prayer: "Detailed instructions on the times, methods, and spiritual dimensions of the five daily prayers (Salat).",
    salat: "Detailed instructions on the times, methods, and spiritual dimensions of the five daily prayers (Salat).",
    mosque: "The virtues of mosques, the acts of worship performed within them, and guidelines for attendees.",
    masjid: "The virtues of mosques, the acts of worship performed within them, and guidelines for attendees.",
    "call to prayer": "Regulations related to the Adhan (call to prayer) and the Iqamah, including their wording and significance.",
    adhan: "Regulations related to the Adhan (call to prayer) and the Iqamah, including their wording and significance.",
    friday: "Special rulings and virtues corresponding to Jumu'ah (Friday) prayer and the Friday sermon (Khutbah).",
    eclipse: "Sunnah of the eclipse prayers (Salat al-Kusuf and Khusuf), recognizing natural phenomena as signs of Allah's power.",
    rain: "The prayer for seeking rain (Salat al-Istisqa) performed during times of drought.",
    fear: "Methodology of performing prayer during times of fear or battlefield situations (Salat al-Khauf).",
    festival: "Guidance on the celebrations, prayers, and rulings of the two Islamic holidays: Eid al-Fitr and Eid al-Adha.",
    eid: "Guidance on the celebrations, prayers, and rulings of the two Islamic holidays: Eid al-Fitr and Eid al-Adha.",
    witr: "The rulings and virtues of the odd-numbered night prayer (Witr) as a highly recommended Sunnah.",
    zakat: "Comprehensive guide to the obligatory almsgiving (Zakat), detailing who must pay, allowable recipients, and calculable wealth types.",
    zakah: "Comprehensive guide to the obligatory almsgiving (Zakat), detailing who must pay, allowable recipients, and calculable wealth types.",
    charity: "The merits of voluntary charity (Sadaqah) and its impact on the individual and society.",
    sadaqah: "The merits of voluntary charity (Sadaqah) and its impact on the individual and society.",
    fasting: "Regulations regarding obligatory fasting during Ramadan and voluntary fasts throughout the year.",
    sawm: "Regulations regarding obligatory fasting during Ramadan and voluntary fasts throughout the year.",
    pilgrimage: "Complete rites and spiritual significance of the major pilgrimage to Mecca (Hajj).",
    hajj: "Complete rites and spiritual significance of the major pilgrimage to Mecca (Hajj).",
    umrah: "Details covering the lesser pilgrimage (Umrah), its rites, and its rewards.",
    buy: "Islamic commercial law, including permissible trade, prohibited transactions, and business ethics.",
    trade: "Islamic commercial law, including permissible trade, prohibited transactions, and business ethics.",
    business: "Islamic commercial law, including permissible trade, prohibited transactions, and business ethics.",
    sales: "Islamic commercial law, including permissible transactions, honoring contracts, and prohibitions against usury (Riba) and fraud.",
    debt: "Rulings on borrowing, lending, transferring debts, and resolving bankruptcies.",
    loan: "Rulings on borrowing, lending, transferring debts, and resolving bankruptcies.",
    agriculture: "Guidelines for farming, crop sharing, irrigation, and utilizing land.",
    farming: "Guidelines for farming, crop sharing, irrigation, and utilizing land.",
    distribution_of_water: "Rights and responsibilities regarding water sources and irrigation distribution.",
    water: "Rights and responsibilities regarding water sources and irrigation distribution.",
    marriage: "Extensive teachings on the marital contract, domestic harmony, choosing a spouse, and spousal rights.",
    nikah: "Extensive teachings on the marital contract, domestic harmony, choosing a spouse, and spousal rights.",
    divorce: "The procedures, cooling-off periods (Iddah), and regulations surrounding marital dissolution (Talaq).",
    talaq: "The procedures, cooling-off periods (Iddah), and regulations surrounding marital dissolution (Talaq).",
    support: "Obligations regarding financial maintenance (Nafaqah) and provisions for family members.",
    food: "Dietary laws distinguishing lawful (Halal) provisions from unlawful (Haram) foods, and etiquette of eating.",
    eating: "Dietary laws distinguishing lawful (Halal) provisions from unlawful (Haram) foods, and etiquette of eating.",
    drink: "Permitted beverages, prohibitions on intoxicants, and the Prophetic manners for drinking.",
    hunting: "Rules regarding lawful hunting practices, use of hunting animals, and slaughtering conditions.",
    slaughter: "Rules regarding lawful hunting practices, use of hunting animals, and slaughtering conditions.",
    sacrifice: "The Sunnah of ritual animal sacrifice during Eid al-Adha (Udhiyah) and child birth (Aqiqah).",
    oath: "Rulings on swearing oaths, fulfilling vows, and the expiation required when breaking them.",
    vow: "Rulings on swearing oaths, fulfilling vows, and the expiation required when breaking them.",
    inheritance: "The complex and precise distribution of inherited wealth among surviving relatives as ordained in Islam.",
    wills: "Instructions on bequeathing property through a final testament (Wasiyyah) within permitted Islamic limits.",
    gift: "The etiquette and legal parameters of giving gifts, transferring wealth, and fostering goodwill.",
    endowment: "Principles of establishing continuous charities or trusts (Waqf) for public or specialized benefit.",
    manumission: "Methods and immense rewards associated with freeing slaves and promoting human liberation.",
    blood_money: "Compensation (Diyah) laws intended for victims or heirs following accidental or intentional bodily harm.",
    punishment: "The prescribed penalties (Hudud) for major transgressions to preserve societal justice and security.",
    jihad: "The principles of struggle, rules of military engagement, treaties, and the high status of martyrs.",
    expedition: "Historical accounts of military expeditions and battles led by the Prophet (ﷺ).",
    prophet: "Details covering the noble lineage, physical characteristics, and extraordinary signs (Mu'jizat) of Prophet Muhammad (ﷺ).",
    companion: "The brilliant merits, virtues, and ranking of the Prophet's companions (Sahabah).",
    virtue: "Accounts of the exceptional qualities and achievements of various Muslims and tribes.",
    merit: "Accounts of the exceptional qualities and achievements of various Muslims and tribes.",
    medicine: "The Prophetic approach to health, remedies, diseases, and the balance between relying on Allah and seeking treatment.",
    illness: "The Prophetic approach to health, remedies, diseases, and the balance between relying on Allah and seeking treatment.",
    sick: "The Prophetic approach to health, remedies, diseases, and the balance between relying on Allah and seeking treatment.",
    clothing: "Islamic guidelines regarding modesty in dress, adornment, prohibitions on certain fabrics, and personal grooming.",
    dress: "Islamic guidelines regarding modesty in dress, adornment, prohibitions on certain fabrics, and personal grooming.",
    manners: "The essence of excellent character (Adab), emphasizing respect, kindness, and societal morals.",
    adab: "The essence of excellent character (Adab), emphasizing respect, kindness, and societal morals.",
    supplication: "The texts and virtues of calling upon Allah (Du'a) in various situations.",
    dua: "The texts and virtues of calling upon Allah (Du'a) in various situations.",
    remembrance: "Encouragement towards continuous remembrance of Allah (Dhikr) and the immense rewards it carries.",
    dhikr: "Encouragement towards continuous remembrance of Allah (Dhikr) and the immense rewards it carries.",
    heart: "Teachings aimed at spiritually softening the heart (Riqaq), practicing asceticism, and warning against worldly attachments.",
    decree: "Understanding the divine preordainment (Qadar) and trusting in Allah's ultimate plan.",
    qadar: "Understanding the divine preordainment (Qadar) and trusting in Allah's ultimate plan.",
    dream: "The significance of dreams, visions, and their interpretations in Islamic tradition.",
    vision: "The significance of dreams, visions, and their interpretations in Islamic tradition.",
    sedition: "Prophecies regarding major trials, tribulations, and the emergence of falsehood near the End of Times.",
    trial: "Prophecies regarding major trials, tribulations, and the emergence of falsehood near the End of Times.",
    funerals: "Instructions on washing, shrouding, praying over, and burying the deceased, as well as mourning etiquette.",
    quran: "The virtues, recitation methods, compilation, and undeniable excellence of the Noble Quran.",
    tafsir: "The Prophetic exegesis and linguistic explanations illuminating the meanings of Quranic verses.",
    judgment: "Descriptions of the Day of Resurrection, its terrors, the Reckoning, and the ultimate scales of justice.",
    resurrection: "Descriptions of the Day of Resurrection, its terrors, the Reckoning, and the ultimate scales of justice.",
    paradise: "Vivid depictions of Jannah, its bounties, and the characteristics of its eternal inhabitants.",
    hell: "Warnings regarding Jahannam, its severities, and the causes that lead one toward it.",
    greeting: "The etiquette of spreading peace (Salam), shaking hands, seeking permission to enter, and gathering norms."
};

function assignDescriptionToBook(bookName) {
    if (!bookName) return undefined;

    const lowerName = bookName.toLowerCase();

    // Try exact word match first
    for (const [key, desc] of Object.entries(BOOK_DESCRIPTIONS)) {
        if (lowerName.includes(key)) {
            return desc;
        }
    }

    return "A section containing authenticated traditions on this unique subject, compiled by the author.";
}

function processAllMetadata() {
    const dirs = fs.readdirSync(METADATA_FILES_DIR, { withFileTypes: true });

    for (const dir of dirs) {
        if (!dir.isDirectory()) continue;

        const metaPath = path.join(METADATA_FILES_DIR, dir.name, 'metadata.json');
        if (!fs.existsSync(metaPath)) continue;

        try {
            const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

            let modified = false;
            if (Array.isArray(data.books)) {
                for (const book of data.books) {
                    if (!book.description) {
                        book.description = assignDescriptionToBook(book.name);
                        modified = true;
                    }
                }
            }

            if (modified) {
                fs.writeFileSync(metaPath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`Updated descriptions for ${dir.name}`);
            }
        } catch (e) {
            console.error(`Error processing ${metaPath}:`, e.message);
        }
    }
    console.log("Finished updating book descriptions!");
}

processAllMetadata();
