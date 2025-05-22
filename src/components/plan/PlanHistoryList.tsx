import React, { useEffect, useState } from 'react';
import { PlanHistoryEntry } from '@/types';
import { getAllPlanHistory } from '@/services/planHistoryService';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlanHistoryListProps {
  userId: string;
  limit?: number;
  className?: string;
}

const getActionColor = (action: PlanHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return 'bg-green-500';
    case 'modified':
      return 'bg-blue-500';
    case 'viewed':
      return 'bg-gray-500';
    case 'favorited':
      return 'bg-yellow-500';
    case 'unfavorited':
      return 'bg-orange-500';
    case 'deleted':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getActionIcon = (action: PlanHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return '✨';
    case 'modified':
      return '✏️';
    case 'viewed':
      return '👁️';
    case 'favorited':
      return '⭐';
    case 'unfavorited':
      return '🔄';
    case 'deleted':
      return '🗑️';
    default:
      return '📝';
  }
};

const PlanHistoryList: React.FC<PlanHistoryListProps> = ({ userId, limit, className }) => {
  const [history, setHistory] = useState<PlanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getAllPlanHistory(userId, limit);
        setHistory(historyData);
      } catch (err) {
        console.error('Error fetching plan history:', err);
        setError('Failed to load plan history');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    }
  }, [userId, limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Plan History</CardTitle>
          <CardDescription>Loading your plan activity...</CardDescription>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Plan History</CardTitle>
          <CardDescription>Error loading history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Plan History</CardTitle>
          <CardDescription>Track your plan activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No plan activity yet. Create or interact with plans to see your history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Plan History</CardTitle>
        <CardDescription>Your recent plan activity</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {history.map((entry, index) => (
            <div key={index} className="flex items-start mb-4 pb-4 border-b border-gray-100 last:border-0">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${getActionColor(entry.action)} text-white mr-3 flex-shrink-0`}>
                {getActionIcon(entry.action)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-700">
                      Plan ID: {entry.planId.substring(0, 8)}...
                    </p>
                    {entry.details && (
                      <p className="text-sm text-gray-600 mt-1">{entry.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PlanHistoryList;
