import React, { useState, useMemo } from 'react';
import { Search, Clock, Smile, User, Coffee, Zap, Flag } from 'lucide-react';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose?: () => void;
}

const EMOJI_CATEGORIES = [
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'smileys', icon: Smile, label: 'Smileys' },
    { id: 'people', icon: User, label: 'People' },
    { id: 'food', icon: Coffee, label: 'Food' },
    { id: 'activity', icon: Zap, label: 'Activity' },
    { id: 'flags', icon: Flag, label: 'Flags' },
];

const EMOJIS: Record<string, string[]> = {
    recent: ['👍', '❤️', '😂', '🔥', '🎉', '🤔', '👀'],
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', 'unamused', 'roll_eyes', 'grimacing', 'lying_face', 'relieved', 'pensive', 'sleepy', 'drooling_face', 'sleeping', 'mask', 'sick', 'hurt', 'nauseated', 'vomiting', 'sneezing', 'hot', 'cold', 'woozy', 'dizzy', 'exploding_head', 'cowboy', 'party', 'sunglasses', 'nerd', 'monocle', 'confused', 'worried', 'slightly_frowning_face', 'frowning_face', 'open_mouth', 'hushed', 'astonished', 'flushed', 'pleading', 'frowning', 'anguished', 'fearful', 'cold_sweat', 'disappointed_relieved', 'cry', 'sob', 'scream', 'confounded', 'persevere', 'disappointed', 'sweat', 'weary', 'tired', 'yawn', 'triumph', 'rage', 'angry', 'cursing_face', 'smiling_imp', 'imp', 'skull', 'skull_and_crossbones', 'poop', 'clown_face', 'ogre', 'goblin', 'ghost', 'alien', 'space_invader', 'robot', 'smiley_cat', 'smile_cat', 'joy_cat', 'heart_eyes_cat', 'smirk_cat', 'kissing_cat', 'scream_cat', 'crying_cat_face', 'pouting_cat', 'see_no_evil', 'hear_no_evil', 'speak_no_evil', 'wave', 'raised_back_of_hand', 'raised_hand_with_fingers_splayed', 'hand', 'spock-hand', 'ok_hand', 'pinched_fingers', 'pinching_hand', 'crossed_fingers', 'love_you_gesture', 'metal', 'call_me_hand', 'point_left', 'point_right', 'point_up_2', 'middle_finger', 'point_down', 'point_up', 'thumbsup', 'thumbsdown', 'fist', 'fist_oncoming', 'fist_left', 'fist_right', 'clap', 'raised_hands', 'open_hands', 'palms_up_together', 'handshake', 'pray', 'nail_care', 'selfie', 'muscle', 'mechanical_arm', 'mechanical_leg', 'leg', 'foot', 'ear', 'ear_with_hearing_aid', 'nose', 'brain', 'anatomical_heart', 'lungs', 'tooth', 'bone', 'eyes', 'eye', 'tongue', 'mouth', 'lips', 'baby', 'child', 'boy', 'girl', 'adult', 'person_blond_hair', 'man', 'bearded_person', 'red_haired_man', 'curly_haired_man', 'white_haired_man', 'bald_man', 'woman', 'red_haired_woman', 'curly_haired_woman', 'white_haired_woman', 'bald_woman', 'older_adult', 'older_man', 'older_woman'],
    people: ['👶', '👧', 'child', 'boy', 'girl', 'adult', 'man', 'woman', 'older_adult', 'older_man', 'older_woman', 'man_health_worker', 'woman_health_worker', 'man_student', 'woman_student', 'man_teacher', 'woman_teacher', 'man_judge', 'woman_judge', 'man_farmer', 'woman_farmer', 'man_cook', 'woman_cook', 'man_mechanic', 'woman_mechanic', 'man_factory_worker', 'woman_factory_worker', 'man_business_suit_levitating', 'man_office_worker', 'woman_office_worker', 'man_scientist', 'woman_scientist', 'man_technologist', 'woman_technologist', 'man_singer', 'woman_singer', 'man_artist', 'woman_artist', 'man_pilot', 'woman_pilot', 'man_astronaut', 'woman_astronaut', 'man_firefighter', 'woman_firefighter', 'police_officer', 'man_police_officer', 'woman_police_officer', 'detective', 'guard', 'man_guard', 'woman_guard', 'construction_worker', 'man_construction_worker', 'woman_construction_worker', 'prince', 'princess', 'person_with_turban', 'man_with_turban', 'woman_with_turban', 'man_with_gua_pi_mao', 'woman_with_headscarf', 'uxedo', 'man_in_tuxedo', 'woman_in_tuxedo', 'pregnant_woman', 'breast_feeding', 'woman_feeding_baby', 'man_feeding_baby', 'person_feeding_baby', 'angel', 'santa', 'mrs_claus', 'superhero', 'man_superhero', 'woman_superhero', 'supervillain', 'man_supervillain', 'woman_supervillain', 'mage', 'man_mage', 'woman_mage', 'fairy', 'man_fairy', 'woman_fairy', 'vampire', 'man_vampire', 'woman_vampire', 'merperson', 'merman', 'mermaid', 'elf', 'man_elf', 'woman_elf', 'genie', 'man_genie', 'woman_genie', 'zombie', 'man_zombie', 'woman_zombie', 'massage', 'man_getting_massage', 'woman_getting_massage', 'haircut', 'man_getting_haircut', 'woman_getting_haircut', 'walking', 'man_walking', 'woman_walking', 'standing_person', 'man_standing', 'woman_standing', 'kneeling_person', 'man_kneeling', 'woman_kneeling', 'person_with_probing_cane', 'man_with_probing_cane', 'woman_with_probing_cane', 'person_in_motorized_wheelchair', 'man_in_motorized_wheelchair', 'woman_in_motorized_wheelchair', 'person_in_manual_wheelchair', 'man_in_manual_wheelchair', 'woman_in_manual_wheelchair', 'runner', 'man_running', 'woman_running', 'woman_dancing', 'man_dancing', 'levitate', 'dancers', 'sauna_person', 'man_in_steamy_room', 'woman_in_steamy_room', 'climbing', 'man_climbing', 'woman_climbing'],
    food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', 'falafel', 'taco', 'burrito', 'salad', 'paella', 'canned_food', 'spaghetti', 'ramen', 'stew', 'curry', 'sushi', 'bento', 'dumpling', 'oyster', 'fried_shrimp', 'rice_ball', 'rice', 'rice_cracker', 'fish_cake', 'fortune_cookie', 'moon_cake', 'oden', 'dango', 'shaved_ice', 'ice_cream', 'icecream', 'pie', 'cupcake', 'cake', 'birthday', 'custard', 'candy', 'lollipop', 'chocolate_bar', 'popcorn', 'doughnut', 'cookie', 'milk_glass', 'beer', 'beers', 'clinking_glasses', 'wine_glass', 'tumbler_glass', 'cocktail', 'tropical_drink', 'champagne', 'sake', 'tea', 'teapot', 'coffee', 'juice', 'mate', 'ice_cube', 'chopsticks', 'knife_fork_plate', 'fork_and_knife', 'spoon'],
    activity: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', 'cricket_bat_ball', 'art', 'goal', 'flag_in_hole', 'trophy', 'medal', 'first_place_medal', 'second_place_medal', 'third_place_medal', 'sports_medal', 'reminder_ribbon', 'rosette', 'ticket', 'admission_tickets', 'performing_arts', 'mask', 'coat', 'game_die', 'chess_pawn', 'clapper', 'microphone', 'headphones', 'musical_score', 'musical_keyboard', 'drum_with_drumsticks', 'sax', 'trumpet', 'guitar', 'banjo', 'violin', 'video_game', 'slot_machine', 'bowling', 'curling_stone'],
    flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'],
};

// Simplified list for now - standard unicode emojis
const UNICODE_EMOJIS: Record<string, string[]> = {
    recent: ['👍', '❤️', '😂', '🔥', '🎉', '🤔', '👀', '👋'],
    smileys: ['😀', '😂', '😉', '😊', '😍', '🤔', '🤨', '😐', '🙄', '😪', '😴', '😷', '🤯', '🥳'],
    people: ['👶', '👧', '👨', '👩', '👴', '👵', '👮', '👷', '👸', '🦸', '🧟', '🤰', '💪', '👈', '👉', '👆', '👇'],
    food: ['🍎', '🍌', '🍇', '🍕', '🍔', '🍟', '🍖', '🍗', '🍦', '🍩', '🍪', '☕', '🍷', '🍺', '🍻'],
    activity: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🎮', '🎲', '🎨', '🎬', '🎤', '🎧'],
    flags: ['🚩', '🏳️', '🏳️‍🌈', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇧🇷'],
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('smileys');
    const [search, setSearch] = useState('');

    const filteredEmojis = useMemo(() => {
        if (search) {
            // Very naive search for now since we just have the chars
            // Ideally we'd have metadata. For now we just return all smileys if search is active
            // or implement a basic match if we had names.
            // Returning all for now
            return Object.values(UNICODE_EMOJIS).flat();
        }
        return UNICODE_EMOJIS[activeCategory] || [];
    }, [activeCategory, search]);

    return (
        <div className="w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-80 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search emoji"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-6 gap-1">
                    {filteredEmojis.map((emoji, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelect(emoji)}
                            className="aspect-square flex items-center justify-center text-xl hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="flex items-center justify-between p-2 bg-slate-950 border-t border-slate-800">
                {EMOJI_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`p-2 rounded-lg transition-colors ${activeCategory === cat.id ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            title={cat.label}
                        >
                            <Icon size={18} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
