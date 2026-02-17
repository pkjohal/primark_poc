// Entry scan screen with two-step process (tag then items)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Keyboard } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import PageHeader from '@/components/layout/PageHeader';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import ItemRow from '@/components/session/ItemRow';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useSessionItems } from '@/hooks/useSessionItems';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { SessionItem } from '@/lib/types';
import { isValidBarcode } from '@/lib/utils';

type Step = 'scan_tag' | 'scan_items';

export default function EntryScanScreen() {
  const navigate = useNavigate();
  const { teamMember } = useAuth();
  const { createSession, updateSession } = useSessions();
  const { addSessionItem, removeSessionItem, getSessionItems } = useSessionItems();

  const [step, setStep] = useState<Step>('scan_tag');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tagBarcode, setTagBarcode] = useState<string | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [manualEntry, setManualEntry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing items when session is set
  useEffect(() => {
    if (sessionId) {
      loadSessionItems();
    }
  }, [sessionId]);

  const loadSessionItems = async () => {
    if (!sessionId) return;

    try {
      const sessionItems = await getSessionItems(sessionId);
      setItems(sessionItems);
    } catch (err: any) {
      console.error('Error loading session items:', err);
    }
  };

  const handleTagScan = useBarcodeScan(async (barcode) => {
    if (!teamMember) return;

    setError(null);
    setLoading(true);

    try {
      // Create session with this tag
      const session = await createSession(barcode, teamMember.id);

      if (session) {
        setSessionId(session.id);
        setTagBarcode(barcode);
        setStep('scan_items');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  });

  const handleItemScan = useBarcodeScan(async (barcode) => {
    if (!sessionId) return;

    setError(null);

    try {
      const item = await addSessionItem(sessionId, barcode);
      setItems(prevItems => [...prevItems, item]);
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    }
  }, { debounceTime: 5000 }); // Prevent duplicate scans for 5 seconds

  const handleManualEntry = async () => {
    const barcode = manualEntry.trim().toUpperCase();

    if (!barcode) {
      setError('Please enter a barcode');
      return;
    }

    if (!isValidBarcode(barcode)) {
      setError('Invalid barcode format');
      return;
    }

    if (step === 'scan_tag') {
      handleTagScan.handleScan(barcode);
    } else {
      handleItemScan.handleScan(barcode);
    }

    setManualEntry('');
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeSessionItem(itemId);
      setItems(prevItems => prevItems.filter((item) => item.id !== itemId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
    }
  };

  const handleDone = async () => {
    if (!sessionId || items.length === 0) {
      setError('Please scan at least one item');
      return;
    }

    setLoading(true);

    try {
      await updateSession(sessionId, {
        total_items_in: items.length,
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to complete entry');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? This session will be discarded.')) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey">
      <NavBar />
      <PageHeader
        title={step === 'scan_tag' ? 'Scan Tag' : 'Scan Items'}
        subtitle={
          step === 'scan_tag'
            ? 'Step 1: Scan the changing room tag barcode'
            : `Step 2: Scan all items entering (Tag: ${tagBarcode})`
        }
        showBack
        onBack={handleCancel}
      />

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">
        {/* Scanner */}
        <div className="card">
          <BarcodeScanner
            onScan={step === 'scan_tag' ? handleTagScan.handleScan : handleItemScan.handleScan}
            isActive={!loading}
          />

          {/* Manual entry */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
              placeholder={step === 'scan_tag' ? 'Enter tag barcode' : 'Enter item barcode'}
              className="input"
              disabled={loading}
            />
            <Button
              onClick={handleManualEntry}
              variant="outline"
              disabled={loading}
              className="px-6 flex items-center justify-center gap-2"
            >
              <Keyboard size={20} />
              Add
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Items list (only show in step 2) */}
        {step === 'scan_items' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primark-navy">
                Scanned Items ({items.length})
              </h3>
              {items.length > 0 && (
                <Button
                  onClick={handleDone}
                  variant="success"
                  size="md"
                  isLoading={loading}
                  className='inline-flex text-center items-center gap-2'
                >
                  <Check size={20} />
                  Done
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-primark-grey">
                <p>No items scanned yet</p>
                <p className="text-sm mt-2">Scan or manually enter item barcodes</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {items.map((item) => {
                  // Count how many times this barcode appears
                  const duplicateCount = items.filter(
                    (i) => i.item_barcode === item.item_barcode
                  ).length;

                  return (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onRemove={handleRemoveItem}
                      showRemove={!loading}
                      duplicateCount={duplicateCount}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="card bg-primark-light-blue border border-primark-blue/20">
          <h4 className="font-semibold text-primark-navy mb-2">Instructions</h4>
          {step === 'scan_tag' ? (
            <ul className="text-sm text-primark-grey space-y-1">
              <li>• Scan the unique tag barcode from the changing room</li>
              <li>• Each tag can only have one active session</li>
              <li>• You can also manually enter the barcode if needed</li>
            </ul>
          ) : (
            <ul className="text-sm text-primark-grey space-y-1">
              <li>• Scan each item going into the changing room</li>
              <li>• Multiple items with the same barcode will show a count badge</li>
              <li>• You can remove accidental scans by tapping the X</li>
              <li>• Tap DONE when all items are scanned</li>
              <li>• Manual entry is available if scanner has issues</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
