import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GDPRRightsManager } from '@/components/legal';

export default function UserDataManagement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-6 w-6" />
                Gestion de mes données personnelles
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Exercez vos droits RGPD et gérez vos données personnelles en toute transparence.
              </p>
            </CardHeader>
          </Card>
          
          <GDPRRightsManager />
        </div>
      </div>
    </div>
  );
}