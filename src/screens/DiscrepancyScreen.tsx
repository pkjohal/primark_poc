// Discrepancy screen for handling missing items

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Camera } from 'lucide-react';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/hooks/useSessions';
import { useSessionItems } from '@/hooks/useSessionItems';
import { useShrinkage } from '@/hooks/useShrinkage';
import { useBarcodeScan } from '@/hooks/useBarcodeScan';
import { SessionItem } from '@/lib/types';

export default function DiscrepancyScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { teamMember } = useAuth();
  const { getSessionById, updateSession } = useSessions();
  const { getUnresolvedItems, findItemByBarcode, markItemAsPurchased, markItemAsRestocked } =
    useSessionItems();
  const { logLostItem } = useShrinkage();

  const [unresolvedItems, setUnresolvedItems] = useState<SessionItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadUnresolvedItems();
    }
  }, [sessionId]);

  const loadUnresolvedItems = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const items = await getUnresolvedItems(sessionId);
      setUnresolvedItems(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemScan = useBarcodeScan(async (barcode) => {
    if (!sessionId) return;

    setError(null);

    try {
      const item = await findItemByBarcode(sessionId, barcode);

      if (item) {
        // Found the item! Mark as purchased
        await markItemAsPurchased(item.id);
        await loadUnresolvedItems();

        // If all resolved, complete session
        if (unresolvedItems.length === 1) {
          await completeSession(false);
        }
      } else {
        setError(`Item ${barcode} not found in this session`);
      }
    } catch (err: any) {
      setError(err.message);
    }
  });

  const handleMarkAsLost = async () => {
    if (!sessionId || !teamMember) return;

    setLoading(true);

    try {
      // Mark all unresolved items as lost
      for (const item of unresolvedItems) {
        await markItemAsRestocked(item.id);
        await logLostItem(sessionId, item.item_barcode, teamMember.id, 'Item not returned from changing room');
      }

      await completeSession(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeSession = async (flagged: boolean) => {
    if (!sessionId) return;

    try {
      const session = await getSessionById(sessionId);
      if (!session) return;

      const purchased = session.total_items_in - unresolvedItems.length;
      const lost = unresolvedItems.length;

      await updateSession(sessionId, {
        status: flagged ? 'flagged' : 'complete',
        total_items_out: session.total_items_in,
        items_purchased: purchased,
        items_lost: lost,
        exit_complete_time: new Date().toISOString(),
      });

      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primark-red">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primark-red text-white p-6">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={64} className="text-primark-red" />
          </div>
          <h1 className="text-4xl font-bold mb-2">DISCREPANCY DETECTED</h1>
          <p className="text-xl">Items are missing from this session</p>
        </div>

        {/* Unresolved items */}
        <div className="bg-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Unresolved Items ({unresolvedItems.length})</h2>
          <div className="space-y-2">
            {unresolvedItems.map((item) => (
              <div key={item.id} className="bg-white/20 rounded-lg p-4">
                <p className="text-xl font-mono font-bold">{item.item_barcode}</p>
                <p className="text-sm opacity-80">
                  Scanned in at{' '}
                  {new Date(item.scanned_in_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scanner */}
        {showScanner && (
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4">
              <BarcodeScanner onScan={handleItemScan.handleScan} isActive={true} />
              <Button
                onClick={() => setShowScanner(false)}
                variant="outline"
                className="w-full mt-4 border-2 border-primark-navy text-primark-navy hover:bg-primark-light-grey"
              >
                Close Scanner
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto space-y-3">
          {!showScanner && (
            <Button
              onClick={() => setShowScanner(true)}
              variant="primary"
              size="lg"
              className="w-full bg-white text-primark-red hover:bg-white/90"
            >
              <Camera size={24} className="mr-2" />
              SCAN FOR MISSING ITEMS
            </Button>
          )}
          <Button
            onClick={() => setShowConfirm(true)}
            variant="danger"
            size="lg"
            className="w-full bg-primark-navy hover:bg-primark-navy/90"
          >
            MARK AS LOST
          </Button>
          <p className="text-center text-sm opacity-80">
            Items marked as lost will be logged for shrinkage reporting
          </p>
        </div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleMarkAsLost}
        title="Mark Items as Lost?"
        message={`This will permanently mark ${unresolvedItems.length} item(s) as lost and close this session as flagged. This action cannot be undone.`}
        confirmText="Mark as Lost"
        variant="danger"
      />
    </div>
  );
}
