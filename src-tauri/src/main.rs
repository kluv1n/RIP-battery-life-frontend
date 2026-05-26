#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    battery_life_guest_lib::run()
}
