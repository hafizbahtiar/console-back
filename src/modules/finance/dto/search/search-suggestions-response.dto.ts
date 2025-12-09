import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SearchSuggestionDto {
    @Expose()
    text: string;

    @Expose()
    type: 'description' | 'note' | 'reference' | 'tag' | 'paymentMethod';

    @Expose()
    count: number;
}

@Exclude()
export class SearchSuggestionsResponseDto {
    @Expose()
    suggestions: SearchSuggestionDto[];
}

