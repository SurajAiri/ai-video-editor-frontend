export interface InvalidModel {
    start_time: number;
    end_time: number;
    type: 'repetition' | 'long_pauses' | 'filler_word';
    is_entire: boolean;
}