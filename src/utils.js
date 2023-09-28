const fs = require( "node:fs" );
const path = require( "node:path" );
const getAllTags = () => {
    const tags = [];
    JSON.parse(
        fs.readFileSync(path.join( __dirname, "data/faqs.json" ))
    ).forEach((faq) => tags.push(...faq.tags));

    return tags;
};

const tagsExist = (faqs, tags) => {
    for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.tags.some((t) => tags.includes(t))) return true;
    };

    return false;
};

const tagExists = (faqs, tag) => {
    for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        if (faq.tags.some((t) => t == tag)) return true;
    };

    return false;
};

module.exports = { getAllTags, tagsExist, tagExists };