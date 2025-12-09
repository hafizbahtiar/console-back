# Receipt OCR Integration & Auto-Categorization

> **Status**: Planning/Design Phase  
> **Priority**: Optional Enhancement  
> **Last Updated**: 04 Dec 2025  
> **OCR Solution**: Tesseract OCR (Open Source)

## Overview

This document outlines the implementation plan for adding OCR (Optical Character Recognition) capabilities to extract transaction details from receipt images and automatically categorize transactions based on the extracted data.

**⚠️ CRITICAL DESIGN PRINCIPLE**: After OCR extraction, extracted data is **ALWAYS** shown to the user in a review modal for verification and correction before being applied to the transaction. **OCR data is NEVER auto-applied**. This ensures accuracy and gives users full control over their data.

### Why User Review is Essential

1. **OCR Accuracy**: Tesseract OCR may have errors, especially with poor quality images
2. **User Control**: Users know their transactions better than OCR
3. **Data Quality**: Manual review ensures accurate financial records
4. **Trust**: Users trust the system more when they can verify data
5. **Learning**: User corrections help improve future suggestions

### Complete Flow

```
Upload Receipt → Extract OCR → Show Review Modal → User Edits → Apply to Transaction
```

**Key Point**: The review modal is the critical step where users verify and correct OCR data before it's applied.

## Goals

1. **Extract Transaction Details from Receipts**
   - Amount
   - Date
   - Merchant/Vendor name
   - Items purchased
   - Tax amount
   - Payment method

2. **Auto-Categorize Transactions**
   - Match merchant names to existing categories
   - Suggest category based on extracted data
   - Learn from user corrections

3. **Improve User Experience**
   - Reduce manual data entry
   - Increase accuracy
   - Save time

## Technology Choice: Tesseract OCR

**Selected Solution**: Tesseract OCR (Open Source)

### Why Tesseract?

**Pros:**
- ✅ **Free and open source** - No per-call costs
- ✅ **No external API dependencies** - Works offline
- ✅ **Full control** - Can customize and optimize
- ✅ **Privacy-friendly** - Data stays on our servers
- ✅ **Scalable** - No API rate limits or quotas
- ✅ **Cost-effective** - Perfect for high-volume scenarios

**Cons:**
- ⚠️ Lower accuracy than cloud services (but acceptable with user review)
- ⚠️ Requires image preprocessing for best results
- ⚠️ More complex implementation
- ⚠️ Requires server resources (CPU/memory)

### Why This Works for Our Use Case

Since we're implementing a **user review step** after OCR extraction, Tesseract's slightly lower accuracy is acceptable because:
1. Users will review and correct any errors
2. We can improve accuracy with better preprocessing
3. Cost savings are significant for high-volume usage
4. No external dependencies or API costs
5. Better privacy (receipts stay on our servers)

### Alternative: Cloud APIs (Future Consideration)

If accuracy becomes an issue or we need better results:
- Can add Google Cloud Vision API as an optional premium feature
- Can use hybrid approach (Tesseract first, cloud API as fallback)
- Can offer both options to users

## User Flow

### Complete OCR Flow

```
1. User uploads receipt image
   ↓
2. Backend stores receipt file
   ↓
3. User clicks "Extract Receipt Data" button (optional, can be auto-triggered)
   ↓
4. Backend processes image with Tesseract OCR
   ↓
5. Backend extracts structured data
   ↓
6. Backend returns extracted data to frontend
   ↓
7. Frontend shows OCR Review Modal/Dialog
   - Display extracted data in editable form
   - Show confidence scores
   - Highlight low-confidence fields
   ↓
8. User reviews and edits extracted data
   - Correct merchant name
   - Fix amounts
   - Adjust date
   - Edit items
   - Select/confirm category
   ↓
9. User clicks "Apply to Transaction"
   ↓
10. Frontend sends corrected data to backend
   ↓
11. Backend updates transaction with corrected data
   ↓
12. Backend learns from corrections (update merchant mappings)
```

### Key Design Principles

1. **User Always Reviews** - Never auto-apply OCR data without user confirmation
2. **Editable Fields** - All extracted data can be edited
3. **Confidence Indicators** - Show which fields have low confidence
4. **Save Draft** - Allow saving OCR data without applying
5. **Re-extract** - Allow re-running OCR if needed

### 2. Data Extraction Strategy

#### Receipt Data Structure

```typescript
interface ReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  date?: Date;
  totalAmount?: number;
  taxAmount?: number;
  subtotal?: number;
  items?: ReceiptItem[];
  paymentMethod?: string;
  receiptNumber?: string;
  confidence?: number; // OCR confidence score
}

interface ReceiptItem {
  description: string;
  quantity?: number;
  price?: number;
  total?: number;
}
```

#### Extraction Rules

1. **Merchant Name**
   - Usually at top of receipt
   - Look for largest/boldest text
   - Common patterns: "STORE NAME", "MERCHANT NAME"

2. **Date**
   - Common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
   - Usually near top or bottom
   - Look for date patterns

3. **Total Amount**
   - Look for "TOTAL", "AMOUNT DUE", "GRAND TOTAL"
   - Usually largest number at bottom
   - May include currency symbol

4. **Tax Amount**
   - Look for "TAX", "VAT", "GST"
   - Usually near total

5. **Items**
   - Parse line items
   - Extract description, quantity, price
   - May require line-by-line parsing

### 3. Auto-Categorization Service

```typescript
// services/receipt-categorization.service.ts
@Injectable()
export class ReceiptCategorizationService {
  async suggestCategory(
    userId: string,
    receiptData: ReceiptData,
  ): Promise<CategorySuggestion> {
    // 1. Match merchant name to existing transactions
    // 2. Check user's category preferences
    // 3. Use merchant category mapping
    // 4. Return suggested category with confidence
  }
}
```

#### Categorization Strategies

1. **Merchant Name Matching**
   - Check if merchant name exists in user's transaction history
   - Use most common category for that merchant
   - Confidence: High if multiple matches

2. **Merchant Category Database**
   - Maintain a database of merchant categories
   - E.g., "Walmart" → "Groceries", "Starbucks" → "Food & Dining"
   - Can be user-specific or global

3. **Keyword Matching**
   - Extract keywords from receipt items
   - Match keywords to category names
   - E.g., "coffee", "latte" → "Food & Dining"

4. **Machine Learning (Future)**
   - Train model on user's transaction history
   - Learn patterns from user corrections
   - Improve over time

### 4. Integration Points

#### Receipt Upload Flow (No Auto-OCR)

```typescript
// In FinanceTransactionsService.uploadReceipt()

async uploadReceipt(
  userId: string,
  transactionId: string,
  file: Express.Multer.File,
): Promise<TransactionDocument> {
  // 1. Upload file (existing logic)
  const uploadedFile = await this.fileUploadService.uploadFile(...);
  
  // 2. Update transaction with receipt URL
  transaction.receiptUrl = uploadedFile.url;
  transaction.receiptFilename = uploadedFile.originalName;
  transaction.receiptMimetype = uploadedFile.mimetype;
  transaction.receiptSize = uploadedFile.size;
  transaction.receiptUploadedAt = new Date();
  
  // Note: OCR is NOT triggered automatically
  // User must explicitly request OCR extraction
  
  return transaction.save();
}
```

#### OCR Extraction Flow (Separate Endpoint)

```typescript
// In FinanceTransactionsService.extractReceiptOcr()

async extractReceiptOcr(
  userId: string,
  transactionId: string,
): Promise<ReceiptData> {
  // 1. Get transaction (verify ownership)
  const transaction = await this.findOne(userId, transactionId);
  
  // 2. Check if receipt exists
  if (!transaction.receiptUrl) {
    throw new NotFoundException('No receipt found for this transaction');
  }
  
  // 3. Extract data using OCR
  const receiptData = await this.receiptOcrService.extractReceiptData(
    transaction.receiptUrl,
  );
  
  // 4. Auto-categorize (suggest category)
  if (receiptData.merchantName) {
    const suggestion = await this.receiptCategorizationService.suggestCategory(
      userId,
      receiptData,
    );
    receiptData.suggestedCategory = suggestion;
  }
  
  // 5. Store extracted data (as draft, not applied)
  transaction.receiptOcrData = receiptData;
  transaction.ocrExtractedAt = new Date();
  await transaction.save();
  
  // 6. Return extracted data for user review
  return receiptData;
}
```

#### Apply OCR Data Flow (After User Review)

```typescript
// In FinanceTransactionsService.applyOcrData()

async applyOcrData(
  userId: string,
  transactionId: string,
  ocrData: Partial<ReceiptData>, // User-corrected data
): Promise<TransactionDocument> {
  // 1. Get transaction
  const transaction = await this.findOne(userId, transactionId);
  
  // 2. Apply user-corrected OCR data
  if (ocrData.totalAmount !== undefined) {
    transaction.amount = ocrData.totalAmount;
  }
  if (ocrData.date) {
    transaction.date = ocrData.date;
  }
  if (ocrData.merchantName) {
    transaction.description = ocrData.merchantName;
  }
  if (ocrData.suggestedCategory?.categoryId) {
    transaction.categoryId = ocrData.suggestedCategory.categoryId;
  }
  // ... apply other fields
  
  // 3. Mark OCR as applied
  transaction.ocrApplied = true;
  transaction.ocrAppliedAt = new Date();
  
  // 4. Learn from user corrections (update merchant mapping)
  if (ocrData.merchantName && ocrData.suggestedCategory?.categoryId) {
    await this.receiptCategorizationService.updateMerchantMapping(
      userId,
      ocrData.merchantName,
      ocrData.suggestedCategory.categoryId,
    );
  }
  
  return transaction.save();
}
```

## API Design

### New Endpoints

#### 1. Extract Receipt Data (OCR)
```
POST /api/v1/finance/transactions/:id/receipt/extract
```

**Request:**
- No body (uses existing receipt)

**Response:**
```json
{
  "success": true,
  "data": {
    "receiptData": {
      "merchantName": "Walmart",
      "date": "2025-12-04",
      "totalAmount": 125.50,
      "taxAmount": 10.00,
      "items": [...],
      "confidence": 0.95
    },
    "suggestedCategory": {
      "categoryId": "cat_123",
      "categoryName": "Groceries",
      "confidence": 0.85
    }
  },
  "message": "Receipt data extracted successfully"
}
```

#### 2. Apply OCR Data to Transaction
```
PATCH /api/v1/finance/transactions/:id/apply-ocr
```

**Request:**
```json
{
  "updateFields": ["amount", "date", "categoryId", "description"],
  "categoryId": "cat_123", // Optional: override suggestion
  "reviewed": true // User reviewed and confirmed
}
```

**Response:**
- Updated transaction with OCR data applied

#### 3. Get OCR Extraction History
```
GET /api/v1/finance/transactions/:id/receipt/ocr-history
```

**Response:**
- History of OCR extractions for this receipt
- Confidence scores
- User corrections

## Database Schema Updates

### Transaction Schema Additions

```typescript
// Add to finance-transaction.schema.ts

@Prop({ type: Object })
receiptOcrData?: {
  merchantName?: string;
  merchantAddress?: string;
  date?: Date;
  totalAmount?: number;
  taxAmount?: number;
  subtotal?: number;
  items?: Array<{
    description: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
  paymentMethod?: string;
  receiptNumber?: string;
  confidence?: number;
  extractedAt?: Date;
};

@Prop({ type: Types.ObjectId, ref: 'FinanceCategory' })
suggestedCategoryId?: Types.ObjectId;

@Prop({ type: Number, min: 0, max: 1 })
suggestedCategoryConfidence?: number; // 0-1 confidence score

@Prop({ type: Boolean, default: false })
ocrApplied?: boolean; // Whether user applied OCR data
```

### Merchant Category Mapping Schema (New)

```typescript
// schemas/finance-merchant-category.schema.ts

@Schema({ timestamps: true })
export class MerchantCategory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  merchantName: string; // Normalized merchant name

  @Prop({ type: Types.ObjectId, ref: 'FinanceCategory', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  matchCount: number; // How many times this mapping was used

  @Prop({ type: Number, min: 0, max: 1, default: 1 })
  confidence: number; // User confidence in this mapping

  @Prop({ type: Date })
  lastUsedAt: Date;
}
```

## Implementation Steps

### Phase 1: OCR Service Setup (Week 1)

1. **Set up Google Cloud Vision API**
   - Create Google Cloud project
   - Enable Vision API
   - Create service account
   - Generate API key
   - Add to environment variables

2. **Install Dependencies**
   ```bash
   npm install @google-cloud/vision
   ```

3. **Create OCR Service**
   - Create `ReceiptOcrService`
   - Implement image download
   - Implement Vision API integration
   - Parse response to structured data

4. **Add Configuration**
   - Add `GOOGLE_CLOUD_VISION_API_KEY` to `.env`
   - Add OCR settings to config

### Phase 2: Data Extraction (Week 1-2)

1. **Implement Receipt Parser**
   - Parse merchant name
   - Parse date (multiple formats)
   - Parse amounts (total, tax, subtotal)
   - Parse line items
   - Handle edge cases

2. **Add Confidence Scoring**
   - Calculate confidence for each field
   - Overall receipt confidence score

3. **Error Handling**
   - Handle API failures
   - Handle parsing errors
   - Return meaningful error messages

### Phase 3: Auto-Categorization (Week 2)

1. **Create Merchant Category Service**
   - Create `MerchantCategory` schema
   - Implement CRUD operations
   - Implement matching logic

2. **Implement Categorization Logic**
   - Merchant name matching
   - Category database lookup
   - Keyword matching
   - Confidence calculation

3. **Create Category Mapping Endpoints**
   - Create/update merchant category mappings
   - Get user's merchant mappings
   - Bulk import mappings

### Phase 4: Integration (Week 2-3)

1. **Update Receipt Upload**
   - Add OCR option to upload endpoint
   - Integrate OCR extraction
   - Store extracted data

2. **Create OCR Endpoints**
   - Extract receipt data endpoint
   - Apply OCR data endpoint
   - Get OCR history endpoint

3. **Update Transaction DTOs**
   - Add OCR data fields
   - Add suggested category fields

### Phase 5: Frontend - User Review UI (Week 3)

1. **Create OCR Review Modal Component**
   - Display extracted data in editable form
   - Show confidence scores for each field
   - Highlight low-confidence fields
   - Allow editing all fields
   - Category selector with suggestion

2. **Add Receipt Actions Component**
   - "Extract Receipt Data" button
   - Show OCR status (extracted, applied, etc.)
   - Trigger OCR extraction
   - Open review modal

3. **Integrate with Transaction Form/Table**
   - Add receipt actions to transaction row
   - Show OCR badge/indicator
   - Handle OCR flow

4. **Add Loading States**
   - Show progress during OCR (can take 5-10 seconds)
   - Display "Processing..." message
   - Handle errors gracefully

5. **Add Learning Mechanism**
   - Track user corrections
   - Update merchant mappings
   - Improve suggestions over time

## Cost Considerations

### Tesseract OCR Costs

- **Free** - No per-call costs
- **Server Resources**: CPU and memory for processing
- **Storage**: Store OCR results (minimal)

### Cost Optimization Strategies

1. **Caching**
   - Cache OCR results for same receipt (hash-based)
   - Avoid re-processing same image
   - Store in database

2. **User Opt-in**
   - Make OCR optional (user must click "Extract")
   - Only process when user explicitly requests

3. **Async Processing**
   - Process OCR in background job
   - Don't block user request
   - Use queue system for high volume

4. **Image Optimization**
   - Preprocess images efficiently
   - Resize to optimal size (not too large, not too small)
   - Cache preprocessed images

5. **Rate Limiting**
   - Limit OCR requests per user
   - Prevent abuse
   - Queue requests if needed

## Error Handling

### OCR Failures

```typescript
try {
  const receiptData = await this.receiptOcrService.extractReceiptData(url);
} catch (error) {
  if (error.code === 'API_QUOTA_EXCEEDED') {
    // Handle quota exceeded
  } else if (error.code === 'INVALID_IMAGE') {
    // Handle invalid image
  } else {
    // Handle other errors
  }
}
```

### Low Confidence Handling

- If confidence < 0.7, mark as "needs review"
- Show warning to user
- Allow manual correction

## Testing Strategy

### Unit Tests

- Test OCR service with sample receipts
- Test categorization logic
- Test parsing edge cases

### Integration Tests

- Test full OCR flow
- Test API integration
- Test error scenarios

### Sample Receipts

- Collect various receipt formats
- Test with different languages
- Test with poor quality images

## Security Considerations

1. **Image Privacy**
   - Receipts may contain sensitive data
   - Ensure proper access control
   - Consider data retention policies
   - Store images securely

2. **Rate Limiting**
   - Limit OCR requests per user
   - Prevent abuse
   - Queue requests if needed

3. **Data Validation**
   - Validate all user-corrected data
   - Sanitize inputs
   - Prevent injection attacks

## Future Enhancements

1. **Machine Learning**
   - Train custom model on user data
   - Improve accuracy over time
   - Learn from corrections

2. **Multi-language Support**
   - Support receipts in different languages
   - Language detection

3. **Receipt Templates**
   - Support common receipt formats
   - Template-based extraction

4. **Batch Processing**
   - Process multiple receipts at once
   - Bulk categorization

5. **Smart Suggestions**
   - Learn user preferences
   - Suggest based on time/location
   - Context-aware categorization

## Frontend Implementation

### OCR Review Modal Component

```typescript
// components/features/finance/receipt-ocr/receipt-ocr-review-modal.tsx

interface ReceiptOcrReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string;
  receiptOcrData: ReceiptOcrData;
  onApply: (correctedData: Partial<ReceiptData>) => void;
}

export function ReceiptOcrReviewModal({
  open,
  onOpenChange,
  transactionId,
  receiptOcrData,
  onApply,
}: ReceiptOcrReviewModalProps) {
  const [formData, setFormData] = useState(receiptOcrData);
  const [isApplying, setIsApplying] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Extracted Receipt Data</DialogTitle>
          <DialogDescription>
            Please review and correct the extracted data. Fields with low confidence are highlighted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Merchant Name */}
          <FormField
            label="Merchant Name"
            value={formData.merchantName.value}
            onChange={(value) => setFormData({...formData, merchantName: {...formData.merchantName, value}})}
            confidence={formData.merchantName.confidence}
            error={formData.merchantName.confidence < 0.7 ? "Low confidence - please verify" : undefined}
          />

          {/* Date */}
          <FormField
            label="Date"
            type="date"
            value={formData.date.value}
            onChange={(value) => setFormData({...formData, date: {...formData.date, value}})}
            confidence={formData.date.confidence}
          />

          {/* Total Amount */}
          <FormField
            label="Total Amount"
            type="number"
            value={formData.totalAmount.value}
            onChange={(value) => setFormData({...formData, totalAmount: {...formData.totalAmount, value}})}
            confidence={formData.totalAmount.confidence}
          />

          {/* Tax Amount */}
          <FormField
            label="Tax Amount"
            type="number"
            value={formData.taxAmount.value}
            onChange={(value) => setFormData({...formData, taxAmount: {...formData.taxAmount, value}})}
            confidence={formData.taxAmount.confidence}
          />

          {/* Suggested Category */}
          {formData.suggestedCategory && (
            <CategorySelector
              label="Category"
              value={formData.suggestedCategory.categoryId}
              onChange={(categoryId) => setFormData({...formData, suggestedCategory: {...formData.suggestedCategory, categoryId}})}
              suggestion={formData.suggestedCategory}
            />
          )}

          {/* Items List */}
          <ItemsList
            items={formData.items}
            onChange={(items) => setFormData({...formData, items})}
          />

          {/* Confidence Summary */}
          <ConfidenceSummary overallConfidence={formData.overallConfidence} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setIsApplying(true);
              await onApply(formData);
              setIsApplying(false);
              onOpenChange(false);
            }}
            disabled={isApplying}
          >
            {isApplying ? "Applying..." : "Apply to Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Receipt Actions Component

```typescript
// components/features/finance/receipt-actions.tsx

export function ReceiptActions({ transaction }: { transaction: Transaction }) {
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [ocrData, setOcrData] = useState<ReceiptOcrData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractOcr = async () => {
    setIsExtracting(true);
    try {
      const data = await extractReceiptOcr(transaction.id);
      setOcrData(data);
      setShowOcrReview(true);
    } catch (error) {
      toast.error("Failed to extract receipt data");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyOcr = async (correctedData: Partial<ReceiptData>) => {
    try {
      await applyOcrData(transaction.id, correctedData);
      toast.success("Receipt data applied successfully");
      setShowOcrReview(false);
      // Refresh transaction list
    } catch (error) {
      toast.error("Failed to apply receipt data");
    }
  };

  return (
    <>
      {transaction.receiptUrl && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtractOcr}
            disabled={isExtracting}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <ScanLine className="h-4 w-4 mr-2" />
                Extract Receipt Data
              </>
            )}
          </Button>

          {transaction.receiptOcrData && !transaction.ocrApplied && (
            <Badge variant="secondary">
              OCR Data Available - Review Required
            </Badge>
          )}

          {transaction.ocrApplied && (
            <Badge variant="default">
              OCR Applied
            </Badge>
          )}
        </div>
      )}

      {showOcrReview && ocrData && (
        <ReceiptOcrReviewModal
          open={showOcrReview}
          onOpenChange={setShowOcrReview}
          transactionId={transaction.id}
          receiptOcrData={ocrData}
          onApply={handleApplyOcr}
        />
      )}
    </>
  );
}
```

### UI/UX Considerations

1. **Confidence Indicators**
   - Green: High confidence (>0.8)
   - Yellow: Medium confidence (0.6-0.8)
   - Red: Low confidence (<0.6)
   - Show confidence badge next to each field

2. **Field Highlighting**
   - Highlight low-confidence fields with border color
   - Show warning icon for fields needing attention
   - Tooltip explaining confidence score

3. **Loading States**
   - Show progress during OCR extraction (can take 5-10 seconds)
   - Display "Processing receipt..." message
   - Show estimated time remaining

4. **Error Handling**
   - If OCR fails, show friendly error message
   - Offer to retry
   - Allow manual entry as fallback

5. **Success Feedback**
   - Show success message after applying
   - Highlight which fields were updated
   - Option to undo changes

## Tesseract Implementation Details

### Setup

```bash
npm install tesseract.js
# or for better performance (native bindings)
npm install node-tesseract-ocr
```

### Backend Implementation

```typescript
// services/receipt-ocr.service.ts
import Tesseract from 'tesseract.js';
import sharp from 'sharp'; // For image preprocessing

@Injectable()
export class ReceiptOcrService {
  async extractReceiptData(imageUrl: string): Promise<ReceiptData> {
    // 1. Download image
    const imageBuffer = await this.downloadImage(imageUrl);
    
    // 2. Preprocess image for better OCR accuracy
    const processedImage = await this.preprocessImage(imageBuffer);
    
    // 3. Run Tesseract OCR
    const { data: { text, confidence } } = await Tesseract.recognize(
      processedImage,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // Can send progress updates to frontend via WebSocket
            console.log(`Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );
    
    // 4. Parse extracted text
    const receiptData = this.parseReceiptText(text);
    
    // 5. Calculate confidence scores for each field
    receiptData.overallConfidence = confidence / 100;
    
    return receiptData;
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Image preprocessing for better OCR results
    return sharp(imageBuffer)
      .greyscale()                    // Convert to grayscale
      .normalize()                    // Normalize contrast
      .sharpen()                      // Sharpen edges
      .threshold(128)                 // Binarize (black/white)
      .resize(2000, null, {           // Resize for optimal OCR
        withoutEnlargement: true,
        fit: 'inside',
      })
      .toBuffer();
  }

  private parseReceiptText(text: string): ReceiptData {
    const lines = text.split('\n').filter(line => line.trim());
    const receiptData: ReceiptData = {
      items: [],
    };

    // Parse merchant name (usually first non-empty line)
    receiptData.merchantName = {
      value: this.extractMerchantName(lines),
      confidence: 0.85, // Calculate based on position, formatting
    };

    // Parse date
    receiptData.date = {
      value: this.extractDate(lines),
      confidence: this.calculateDateConfidence(lines),
    };

    // Parse amounts
    receiptData.totalAmount = {
      value: this.extractTotalAmount(lines),
      confidence: this.calculateAmountConfidence(lines),
    };

    // Parse items
    receiptData.items = this.extractItems(lines);

    return receiptData;
  }

  private extractMerchantName(lines: string[]): string {
    // Merchant name is usually:
    // - First line with significant text
    // - Often in ALL CAPS
    // - Before date/address
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 50) {
        return line.trim();
      }
    }
    return '';
  }

  private extractDate(lines: string[]): Date | null {
    // Look for date patterns
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,  // MM/DD/YYYY
      /\d{4}-\d{2}-\d{2}/,        // YYYY-MM-DD
      /\d{1,2}-\d{1,2}-\d{4}/,    // DD-MM-YYYY
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          return new Date(match[0]);
        }
      }
    }
    return null;
  }

  private extractTotalAmount(lines: string[]): number | null {
    // Look for "TOTAL", "AMOUNT DUE", etc.
    const totalKeywords = ['TOTAL', 'AMOUNT DUE', 'GRAND TOTAL', 'TOTAL DUE'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      for (const keyword of totalKeywords) {
        if (line.includes(keyword)) {
          // Extract number from this line or next line
          const amount = this.extractAmountFromLine(lines[i] || lines[i + 1]);
          if (amount) return amount;
        }
      }
    }
    
    // Fallback: find largest number at bottom of receipt
    return this.findLargestAmount(lines.slice(-10));
  }

  private extractAmountFromLine(line: string): number | null {
    // Match currency patterns: $123.45, 123.45, etc.
    const amountMatch = line.match(/\$?(\d+\.\d{2})/);
    return amountMatch ? parseFloat(amountMatch[1]) : null;
  }

  private extractItems(lines: string[]): ReceiptItem[] {
    // Parse line items (description, quantity, price)
    const items: ReceiptItem[] = [];
    
    // Items are usually in the middle section
    // Format varies: "Item Name $10.00" or "Item Name 2x $5.00"
    for (const line of lines.slice(2, -5)) {
      const item = this.parseItemLine(line);
      if (item) items.push(item);
    }
    
    return items;
  }

  private parseItemLine(line: string): ReceiptItem | null {
    // Try to parse: "Description Quantity Price"
    // This is complex and depends on receipt format
    // Simplified version:
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const price = this.extractAmountFromLine(lastPart);
      if (price) {
        return {
          description: parts.slice(0, -1).join(' '),
          price,
          confidence: 0.75,
        };
      }
    }
    return null;
  }
}
```

### Performance Optimization

1. **Image Preprocessing**
   - Resize to optimal size (2000px width)
   - Convert to grayscale
   - Enhance contrast
   - Remove noise

2. **Caching**
   - Cache OCR results for same image
   - Store in database with image hash

3. **Async Processing**
   - Process OCR in background job
   - Notify frontend when complete (WebSocket or polling)

4. **Progress Updates**
   - Send progress updates during OCR
   - Show progress bar in UI

## Implementation Summary

### Backend Tasks
1. ✅ Install Tesseract.js
2. ✅ Create ReceiptOcrService
3. ✅ Implement image preprocessing
4. ✅ Implement OCR text extraction
5. ✅ Implement receipt parsing
6. ✅ Create OCR endpoints
7. ✅ Add OCR data to transaction schema
8. ✅ Implement auto-categorization service

### Frontend Tasks (Critical - User Review Flow)
1. ⏳ Create OCR Review Modal component
   - Display extracted data in editable form
   - Show confidence scores for each field
   - Highlight low-confidence fields
   - Allow editing all fields
   - Category selector with suggestion

2. ⏳ Create Receipt Actions component
   - "Extract Receipt Data" button
   - Show OCR status badges
   - Trigger OCR extraction
   - Open review modal after extraction

3. ⏳ Integrate with Transaction UI
   - Add receipt actions to transaction row/card
   - Show OCR status indicators
   - Handle OCR flow (extract → review → apply)

4. ⏳ Add Loading States
   - Show progress during OCR (5-10 seconds)
   - Display "Processing receipt..." message
   - Handle errors gracefully

5. ⏳ Add API Integration
   - `extractReceiptOcr()` function
   - `applyOcrData()` function
   - `getReceiptOcr()` function
   - `discardOcrData()` function

### Key Points

**⚠️ IMPORTANT: User Review is Required**
- OCR data is **NEVER** auto-applied
- User must review and confirm before data is applied
- All fields are editable
- Confidence scores help user identify what needs correction

**Flow:**
1. User uploads receipt → Receipt stored
2. User clicks "Extract" → OCR runs (5-10 seconds)
3. **Review Modal opens** → User sees extracted data
4. User edits/corrects → All fields editable
5. User clicks "Apply" → Data applied to transaction
6. System learns → Updates merchant mappings

## References

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - Open source OCR engine
- [Tesseract.js](https://github.com/naptha/tesseract.js) - JavaScript wrapper for Tesseract
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing library for Node.js
- [Receipt OCR Best Practices](https://www.google.com/search?q=receipt+ocr+best+practices)

---

**Next Steps:**
1. ✅ Review and approve this plan
2. ⏳ Install Tesseract.js and Sharp dependencies
3. ⏳ Create ReceiptOcrService skeleton
4. ⏳ Implement image preprocessing
5. ⏳ Implement basic OCR extraction
6. ⏳ Test with sample receipts
7. ⏳ **Build frontend review modal (CRITICAL)**
8. ⏳ Integrate OCR flow into transaction UI
9. ⏳ Test complete user flow
10. ⏳ Iterate and improve accuracy

