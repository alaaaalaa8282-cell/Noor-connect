---
pretty_name: Sunnah Hadith Dataset
tags:
  - islamic
  - hadees
  - hadith
  - arabic
  - nlp
  - multilingual
  - religious-texts
license: mit
language: [en, ar]
size_categories: 10K<n<100K
---
# Sunnah Dataset — Hadith JSON & CSV Collection

An open-source collection of authenticated Hadiths from the six major books of Sunnah, available in **both JSON and CSV formats** for research, study, and teaching purposes. This dataset is structured cleanly with English + Arabic + grading + reference links for each Hadith.

---

## Contents

This dataset contains the following Hadith collections:

| File Name              | Format | Book Name            |
|------------------------|--------|----------------------|
| Jami' at-Tirmidhi.csv  | CSV    | Jami' at-Tirmidhi    |
| Jami' at-Tirmidhi.json | JSON   | Jami' at-Tirmidhi    |
| Sahih al-Bukhari.csv   | CSV    | Sahih al-Bukhari     |
| Sahih al-Bukhari.json  | JSON   | Sahih al-Bukhari     |
| Sahih Muslim.csv       | CSV    | Sahih Muslim         |
| Sahih Muslim.json      | JSON   | Sahih Muslim         |
| Sunan Abi Dawud.csv    | CSV    | Sunan Abi Dawud      |
| Sunan Abi Dawud.json   | JSON   | Sunan Abi Dawud      |
| Sunan an-Nasa'i.csv    | CSV    | Sunan an-Nasa'i      |
| Sunan an-Nasa'i.json   | JSON   | Sunan an-Nasa'i      |
| Sunan Ibn Majah.csv    | CSV    | Sunan Ibn Majah      |
| Sunan Ibn Majah.json   | JSON   | Sunan Ibn Majah      |

---


## ✨ Features

- Arabic and English Hadith text
- Book + chapter titles in both languages
- Hadith grading (e.g. **Sahih**, **Da’if**)
- In-book reference and direct link to [sunnah.com](https://sunnah.com)
- Machine-readable formats:
  - CSV (great for Excel, spreadsheets, and Pandas)
  - JSON (ideal for devs, AI/ML, and NLP projects)

---

## 🧠 Use Cases

- Build Hadith bots, search engines, and mobile apps
- Train AI/ML models on Islamic texts
- Academic research and data science projects
- Islamic education platforms and interactive learning tools

---

## 🔗 Sample Hadith Entry (JSON)

```json
{
        "Book": "Sahih al-Bukhari",
        "Chapter_Number": 1,
        "Chapter_Title_Arabic": "باب كَيْفَ كَانَ بَدْءُ الْوَحْىِ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم",
        "Chapter_Title_English": "Chapter: How the Divine Revelation started being revealed to Allah's Messenger",
        "Arabic_Text": "حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، يَقُولُ : \" إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ \"",
        "English_Text": "Narrated 'Umar bin Al-Khattab: I heard Allah's Messenger (ﷺ) saying, \"The reward of deeds depends upon the \n     intentions and every person will get the reward according to what he \n     has intended. So whoever emigrated for worldly benefits or for a woman\n     to marry, his emigration was for what he emigrated for.\"",
        "Grade": "",
        "Reference": "https://sunnah.com/bukhari:1",
        "In-book reference": "Book 1, Hadith 1"
}
```



---



Created by Atif
- **GitHub:** [@meeAtif](https://github.com/meeAtif)
- **Linkedin:** [@meAtif](https://www.linkedin.com/in/meatif/)
- **HuggingFace:** [@meeAtif](https://huggingface.co/meeAtif)
- **Email:** iatif@proton.me
- **DM For:** Collaborations, Feedback, or Updates

---