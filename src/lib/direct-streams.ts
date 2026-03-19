/**
 * Direct Islamic Streaming Sources
 * Non-YouTube alternatives for Makkah and Madinah
 */

export const DIRECT_STREAMS = {
    makkah: [
        {
            name: 'Haramain TV',
            url: 'https://www.haramain.tv/live',
            type: 'direct',
            working: true
        },
        {
            name: 'Saudi Quran TV',
            url: 'https://www.sauditv.com/live',
            type: 'direct', 
            working: true
        },
        {
            name: 'Makkah Live Audio',
            url: 'https://stream.radioquran.net/quran-ar',
            type: 'audio',
            working: true
        }
    ],
    madinah: [
        {
            name: 'Nabawi TV',
            url: 'https://www.nabawi.tv/live',
            type: 'direct',
            working: true
        },
        {
            name: 'Saudi Sunnah TV',
            url: 'https://www.sauditv.com/madinah',
            type: 'direct',
            working: true
        },
        {
            name: 'Madinah Live Audio',
            url: 'https://stream.radioquran.net/quran-ar',
            type: 'audio',
            working: true
        }
    ]
};

export const getWorkingStream = (location: 'makkah' | 'madinah') => {
    return DIRECT_STREAMS[location].find(stream => stream.working) || DIRECT_STREAMS[location][0];
};
