let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];


// 1. Search notes
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}


// 2. Find the longest note
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    return notes.reduce((longest, note) =>
        note.text.length > longest.text.length ? note : longest
    );
}


// 3. Count notes by category
function countByCategory() {
    const counts = {};

    notes.forEach(note => {
        if (!counts[note.category]) {
            counts[note.category] = 0;
        }

        counts[note.category]++;
    });

    return counts;
}


// 4. Get summary
function getSummary() {
    const counts = countByCategory();
    const word = notes.length === 1 ? "note" : "notes";

    return `${notes.length} ${word}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}


// 5. Check for duplicates
function isDuplicate(text) {
    const cleanedText = text.trim().replace(/\s+/g, " ").toLowerCase();

    return notes.some(note =>
        note.text.trim().replace(/\s+/g, " ").toLowerCase() === cleanedText
    );
}


// 6. Add a new note
function addNote(text, category) {
    const cleanedText = text.trim();
    const validCategories = ["personal", "work", "study"];

    if (cleanedText.length < 1 || cleanedText.length > 200) {
        console.log("Note not added: text must be 1–200 characters.");
        return false;
    }

    if (isDuplicate(cleanedText)) {
        console.log("Note not added: duplicate note.");
        return false;
    }

    if (!validCategories.includes(category)) {
        console.log("Note not added: invalid category.");
        return false;
    }

    const newNote = {
        id: notes.length + 1,
        text: cleanedText,
        category: category
    };

    notes.push(newNote);

    return true;
}

// TESTS

// searchNotes
console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("pizza"));
// Expected: []


// longestNote
const savedNotes = notes;

notes = [];
console.log(longestNote());
// Expected: null

notes = savedNotes;

console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }


// countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

notes = [
    { id: 1, text: "Buy milk", category: "personal" }
];

console.log(countByCategory());
// Expected: { personal: 1 }

notes = savedNotes;


// getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

notes = [
    { id: 1, text: "Call mum", category: "personal" }
];

console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = savedNotes;


// isDuplicate
console.log(isDuplicate("call mum"));
// Expected: true

console.log(isDuplicate("Buy some shoes"));
// Expected: false


// addNote
console.log(addNote("Read JavaScript documentation", "study"));
// Expected: true

console.log(addNote("Call mum", "personal"));
// Expected: false