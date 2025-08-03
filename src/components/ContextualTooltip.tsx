import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, ExternalLink } from 'lucide-react';

interface TooltipContent {
  title: string;
  description: string;
  tips?: string[];
  learnMoreUrl?: string;
}

interface ContextualTooltipProps {
  content: TooltipContent;
  onDismiss: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  content,
  onDismiss,
  position = 'bottom'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-full mt-2';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} z-50 w-80`}>
      <Card className="glass neomorphism border-primary/20 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4 text-primary" />
              {content.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <CardDescription className="text-xs leading-relaxed">
            {content.description}
          </CardDescription>
          
          {content.tips && content.tips.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-1">Astuces :</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {content.learnMoreUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => window.open(content.learnMoreUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              En savoir plus
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};