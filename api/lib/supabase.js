const { createClient } = require('@supabase/supabase-js');

const supabase = createClient("https://izirdcieneoypjsnuthy.supabase.co", "sb_publishable_ipsQ3gm8_HfyeXjyJDJeIg_5JTS40UC");

module.exports = supabase;