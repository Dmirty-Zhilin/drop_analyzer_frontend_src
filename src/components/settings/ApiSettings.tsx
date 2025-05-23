"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ApiSettingsProps {
  initialSettings?: {
    openRouterApiKey?: string;
    enableThematicAnalysis?: boolean;
  };
  onSave: (settings: { openRouterApiKey: string; enableThematicAnalysis: boolean }) => Promise<void>;
}

export function ApiSettings({ initialSettings, onSave }: ApiSettingsProps) {
  const [openRouterApiKey, setOpenRouterApiKey] = useState(initialSettings?.openRouterApiKey || '');
  const [enableThematicAnalysis, setEnableThematicAnalysis] = useState(initialSettings?.enableThematicAnalysis || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await onSave({
        openRouterApiKey,
        enableThematicAnalysis
      });
      setSaveStatus({
        message: "Настройки API успешно обновлены",
        type: "success"
      });
    } catch (error) {
      setSaveStatus({
        message: "Не удалось сохранить настройки",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки API</CardTitle>
        <CardDescription>
          Настройте параметры для работы с внешними API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openRouterApiKey">OpenRouter API Key</Label>
          <Input
            id="openRouterApiKey"
            type="password"
            value={openRouterApiKey}
            onChange={(e) => setOpenRouterApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
          <p className="text-sm text-gray-500">
            Ключ API для доступа к OpenRouter. Используется для тематического анализа доменов.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="enableThematicAnalysis"
            checked={enableThematicAnalysis}
            onCheckedChange={setEnableThematicAnalysis}
          />
          <Label htmlFor="enableThematicAnalysis">Включить тематический анализ</Label>
        </div>
        
        {saveStatus && (
          <div className={`p-3 rounded-md ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {saveStatus.message}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </CardFooter>
    </Card>
  );
}
