export interface InvalidModel {
    start_time: number;
    end_time: number;
    type: 'repetition' | 'long_pause' | 'filler_words';
    is_entire: boolean;
    text?: string;
    startIndex?: number;
    endIndex?: number;
}
