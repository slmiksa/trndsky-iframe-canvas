import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Newspaper } from 'lucide-react';

interface NewsTicker {
  id: string;
  account_id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

interface NewsTickerManagerProps {
  accountId: string;
  branchId?: string | null;
}

const NewsTickerManager: React.FC<NewsTickerManagerProps> = ({ accountId, branchId }) => {
  const [newsTickers, setNewsTickers] = useState<NewsTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTickerText, setNewTickerText] = useState('');
  const [editingTicker, setEditingTicker] = useState<NewsTicker | null>(null);

  useEffect(() => {
    fetchNewsTickers();
  }, [accountId, branchId]);

  const fetchNewsTickers = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching news tickers for account:', accountId, 'branchId:', branchId);

      let query = supabase
        .from('news_tickers')
        .select('*')
        .eq('account_id', accountId);

      // Apply branch filter if branchId is provided
      if (branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        // Fetch only main account news tickers (where branch_id is null)
        query = query.is('branch_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching news tickers:', error);
        toast({
          title: "Error",
          description: "Failed to load news tickers",
          variant: "destructive",
        });
      } else {
        console.log('✅ News tickers fetched:', data);
        setNewsTickers(data || []);
      }
    } catch (error) {
      console.error('❌ Error in fetchNewsTickers:', error);
      toast({
        title: "Error",
        description: "Failed to load news tickers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewsTicker = async () => {
    if (!accountId) {
      toast({
        title: "Error",
        description: "Account ID not found",
        variant: "destructive",
      });
      return;
    }

    if (!newTickerText.trim()) {
      toast({
        title: "Error",
        description: "Please enter news ticker text",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('➕ Adding new news ticker:', {
        accountId,
        text: newTickerText,
        branchId,
      });

      const { data, error } = await supabase
        .from('news_tickers')
        .insert([{
          account_id: accountId,
          text: newTickerText,
          is_active: true,
          branch_id: branchId || null, // Store branch association
        }])
        .select();

      if (error) {
        console.error('❌ Error adding news ticker:', error);
        toast({
          title: "Error",
          description: "Failed to add news ticker",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker added successfully:', data);
        toast({
          title: "Success",
          description: "News ticker added successfully",
        });
        setNewTickerText('');
        setShowAddForm(false);
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in addNewsTicker:', error);
      toast({
        title: "Error",
        description: "Failed to add news ticker",
        variant: "destructive",
      });
    }
  };

  const updateNewsTicker = async (id: string, text: string) => {
    try {
      console.log('🔄 Updating news ticker:', { id, text });

      const { data, error } = await supabase
        .from('news_tickers')
        .update({ text })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error updating news ticker:', error);
        toast({
          title: "Error",
          description: "Failed to update news ticker",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker updated successfully:', data);
        toast({
          title: "Success",
          description: "News ticker updated successfully",
        });
        setEditingTicker(null);
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in updateNewsTicker:', error);
      toast({
        title: "Error",
        description: "Failed to update news ticker",
        variant: "destructive",
      });
    }
  };

  const toggleNewsTickerStatus = async (id: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling news ticker status:', { id, currentStatus });

      const { data, error } = await supabase
        .from('news_tickers')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error updating news ticker status:', error);
        toast({
          title: "Error",
          description: "Failed to update news ticker status",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker status updated successfully:', data);
        toast({
          title: "Success",
          description: `News ticker ${currentStatus ? 'deactivated' : 'activated'}`,
        });
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in toggleNewsTickerStatus:', error);
      toast({
        title: "Error",
        description: "Failed to update news ticker status",
        variant: "destructive",
      });
    }
  };

  const deleteNewsTicker = async (id: string) => {
    try {
      console.log('🗑️ Deleting news ticker:', id);

      const { data, error } = await supabase
        .from('news_tickers')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Error deleting news ticker:', error);
        toast({
          title: "Error",
          description: "Failed to delete news ticker",
          variant: "destructive",
        });
      } else {
        console.log('✅ News ticker deleted successfully:', data);
        toast({
          title: "Success",
          description: "News ticker deleted successfully",
        });
        fetchNewsTickers();
      }
    } catch (error) {
      console.error('❌ Error in deleteNewsTicker:', error);
      toast({
        title: "Error",
        description: "Failed to delete news ticker",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            News Ticker Management ({newsTickers.length})
          </CardTitle>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add News Ticker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New News Ticker</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addNewsTicker();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="text">Text</Label>
                  <Input
                    id="text"
                    value={newTickerText}
                    onChange={(e) => setNewTickerText(e.target.value)}
                    placeholder="Enter news ticker text"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Ticker</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {newsTickers.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No news tickers yet</p>
            <p className="text-sm text-gray-500">Start by creating a new news ticker</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsTickers.map((ticker) => (
              <div
                key={ticker.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Newspaper className="h-4 w-4 text-blue-500" />
                    <p className="text-gray-700">{ticker.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticker.is_active ? "default" : "secondary"}>
                      {ticker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleNewsTickerStatus(ticker.id, ticker.is_active)}
                    >
                      {ticker.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Dialog open={editingTicker?.id === ticker.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingTicker(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTicker(ticker)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit News Ticker</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (editingTicker) {
                              updateNewsTicker(editingTicker.id, newTickerText);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="text">Text</Label>
                            <Input
                              id="text"
                              value={newTickerText}
                              onChange={(e) => setNewTickerText(e.target.value)}
                              placeholder="Enter news ticker text"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit">Update</Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingTicker(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNewsTicker(ticker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Created at: {new Date(ticker.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsTickerManager;
