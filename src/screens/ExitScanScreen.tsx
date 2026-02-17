// Exit scan screen with item matching and resolution

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Package, ShoppingCart, Keyboard } from 'lucide-react';
import NavBar from '@/components/layout/NavBar';
import PageHeader from '@/components/layout/PageHeader';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useSessionItems } from '@/hooks/useSessionItems';
import { useBackOfHouse } from '@/hooks/useBackOfHouse';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { SessionItem } from '@/lib/types';

type Step = 'scan_tag' | 'scan_items' | 'complete';

export default function ExitScanScreen() {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams();
  const { teamMember } = useAuth();
  const { getSessionByTag, getSessionById, updateSession } = useSessions();
  const {
    getSessionItems,
    findItemByBarcode,
    markItemAsPurchased,
    markItemAsRestocked,
    getUnresolvedItems,
  } = useSessionItems();
  const { addItem: addToBackOfHouse } = useBackOfHouse();

  const [step, setStep] = useState<Step>(sessionIdParam ? 'scan_items' : 'scan_tag');
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam || null);
  const [tagBarcode, setTagBarcode] = useState<string | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SessionItem | null>(null);
  const [manualEntry, setManualEntry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionIdParam) {
      loadSession(sessionIdParam);
    }
  }, [sessionIdParam]);

  const loadSession = async (id: string) => {
    setLoading(true);
    try {
      const session = await getSessionById(id);
      if (!session) {
        setError('Session not found');
        return;
      }

      setSessionId(session.id);
      setTagBarcode(session.tag_barcode);
      const sessionItems = await getSessionItems(session.id);
      setItems(sessionItems);
      setStep('scan_items');

      // Update session status to exiting
      await updateSession(session.id, {
        status: 'exiting',
        exit_start_time: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTagScan = useBarcodeScan(async (barcode) => {
    setError(null);
    setLoading(true);

    try {
      const session = await getSessionByTag(barcode);

      if (!session) {
        setError('No active session found for this tag');
        setLoading(false);
        return;
      }

      setSessionId(session.id);
      setTagBarcode(barcode);
      const sessionItems = await getSessionItems(session.id);
      setItems(sessionItems);
      setStep('scan_items');

      // Update session status to exiting
      await updateSession(session.id, {
        status: 'exiting',
        exit_start_time: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  });

  const handleItemScan = useBarcodeScan(async (barcode) => {
    if (!sessionId) return;

    setError(null);

    try {
      const item = await findItemByBarcode(sessionId, barcode);

      if (!item) {
        setError(`Item ${barcode} not found in this session`);
        return;
      }

      // Count remaining unresolved items with same barcode
      const unresolvedWithSameBarcode = items.filter(
        (i) => i.item_barcode === barcode && i.status === 'in_room'
      ).length;

      if (unresolvedWithSameBarcode > 1) {
        setError(`Note: ${unresolvedWithSameBarcode} items with barcode ${barcode} - scan again after resolving this one`);
      }

      setCurrentItem(item);
    } catch (err: any) {
      setError(err.message);
    }
  });

  const handleManualEntry = () => {
    const barcode = manualEntry.trim().toUpperCase();

    if (!barcode) {
      setError('Please enter a barcode');
      return;
    }

    if (step === 'scan_tag') {
      handleTagScan.handleScan(barcode);
    } else {
      handleItemScan.handleScan(barcode);
    }

    setManualEntry('');
  };

  const handlePurchase = async () => {
    if (!currentItem) return;

    try {
      await markItemAsPurchased(currentItem.id);
      setItems(
        items.map((item) =>
          item.id === currentItem.id ? { ...item, status: 'purchased' as const } : item
        )
      );
      setCurrentItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestock = async () => {
    if (!currentItem || !sessionId || !teamMember) return;

    try {
      await markItemAsRestocked(currentItem.id);
      await addToBackOfHouse(sessionId, currentItem.item_barcode, teamMember.id);

      setItems(
        items.map((item) =>
          item.id === currentItem.id ? { ...item, status: 'restocked' as const } : item
        )
      );
      setCurrentItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAllDone = async () => {
    if (!sessionId) return;

    const unresolved = await getUnresolvedItems(sessionId);

    if (unresolved.length > 0) {
      // Navigate to discrepancy screen
      navigate(`/discrepancy/${sessionId}`, { replace: true });
    } else {
      // All items resolved, show success
      setStep('complete');

      // Update session counts
      const purchased = items.filter((i) => i.status === 'purchased').length;
      const restocked = items.filter((i) => i.status === 'restocked').length;

      await updateSession(sessionId, {
        status: 'complete',
        total_items_out: items.length,
        items_purchased: purchased,
        items_restocked: restocked,
        exit_complete_time: new Date().toISOString(),
      });
    }
  };

  const resolvedCount = items.filter((i) => i.status !== 'in_room').length;

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex flex-col bg-primark-green">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={64} className="text-primark-green" />
            </div>
            <h1 className="text-3xl font-bold mb-2">All Clear!</h1>
            <p className="text-lg mb-8">All items have been accounted for.</p>
            <Button
              onClick={() => navigate('/', { replace: true })}
              variant="primary"
              size="lg"
              className="bg-white text-primark-green hover:bg-white/90"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-light-grey">
      <NavBar />
      <PageHeader
        title={step === 'scan_tag' ? 'Scan Tag' : 'Scan Items Out'}
        subtitle={
          step === 'scan_tag'
            ? 'Scan the changing room tag barcode'
            : `Tag: ${tagBarcode} - Match items leaving`
        }
        showBack
        onBack={() => navigate('/', { replace: true })}
      />

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 space-y-4">
        {/* Progress */}
        {step === 'scan_items' && (
          <div className="card">
            <ProgressBar current={resolvedCount} total={items.length} />
            {resolvedCount === items.length && (
              <Button onClick={handleAllDone} variant="success" className="w-full mt-4">
                <Check size={20} className="mr-2" />
                All Done
              </Button>
            )}
          </div>
        )}

        {/* Scanner */}
        <div className="card">
          <BarcodeScanner
            onScan={step === 'scan_tag' ? handleTagScan.handleScan : handleItemScan.handleScan}
            isActive={!loading && !currentItem}
          />

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={manualEntry}
              onChange={(e) => setManualEntry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
              placeholder={step === 'scan_tag' ? 'Enter tag barcode' : 'Enter item barcode'}
              className="input"
              disabled={loading || !!currentItem}
            />
            <Button onClick={handleManualEntry} variant="outline" disabled={loading || !!currentItem} className="px-6">
              <Keyboard size={20} className="mr-2" />
              Add
            </Button>
          </div>

          {error && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              error.startsWith('Note:')
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {error}
            </div>
          )}
        </div>

        {/* Current item resolution */}
        {currentItem && (
          <div className="card bg-primark-light-blue border-2 border-primark-blue">
            <h3 className="text-lg font-bold text-primark-navy mb-3">Resolve Item</h3>
            <p className="text-2xl font-mono font-bold text-primark-navy mb-4">
              {currentItem.item_barcode}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleRestock} variant="secondary" size="lg">
                <Package size={24} className="mr-2" />
                RESTOCK
              </Button>
              <Button onClick={handlePurchase} variant="success" size="lg">
                <ShoppingCart size={24} className="mr-2" />
                PURCHASE
              </Button>
            </div>
          </div>
        )}

        {/* Items list */}
        {step === 'scan_items' && items.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold text-primark-navy mb-3">Items</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    item.status === 'in_room'
                      ? 'bg-primark-light-grey'
                      : item.status === 'purchased'
                      ? 'bg-green-100'
                      : 'bg-grey-100'
                  }`}
                >
                  <span className="font-medium text-primark-navy">{item.item_barcode}</span>
                  <span className="text-sm capitalize text-primark-grey">
                    {item.status === 'in_room' ? 'Pending' : item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
