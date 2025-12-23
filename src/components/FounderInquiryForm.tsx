import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Linkedin, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FounderInquiryFormProps {
  dealId: string;
  dealName: string;
  onSuccess?: () => void;
}

export function FounderInquiryForm({ dealId, dealName, onSuccess }: FounderInquiryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    founderName: '',
    founderEmail: '',
    founderBio: '',
    linkedinUrl: '',
    additionalInfo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-founder-inquiry', {
        body: {
          dealId,
          founderName: formData.founderName.trim(),
          founderEmail: formData.founderEmail.trim(),
          founderBio: formData.founderBio.trim(),
          linkedinUrl: formData.linkedinUrl.trim() || undefined,
          additionalInfo: formData.additionalInfo.trim() || undefined,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      toast({
        title: 'Inquiry Submitted!',
        description: 'Your information has been sent to the investor.',
      });

      setFormData({
        founderName: '',
        founderEmail: '',
        founderBio: '',
        linkedinUrl: '',
        additionalInfo: '',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit inquiry',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg gradient-text flex items-center gap-2">
          <User className="w-5 h-5" />
          Founder Information
        </CardTitle>
        <CardDescription>
          Share your background with the investor reviewing {dealName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="founderName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="founderName"
                placeholder="John Doe"
                value={formData.founderName}
                onChange={(e) => setFormData(prev => ({ ...prev, founderName: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="founderEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="founderEmail"
                type="email"
                placeholder="john@startup.com"
                value={formData.founderEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, founderEmail: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn Profile URL
            </Label>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/johndoe"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="founderBio" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Your Background & Experience *
            </Label>
            <Textarea
              id="founderBio"
              placeholder="Tell us about your experience, previous companies, relevant expertise, and what drives you to build this company..."
              value={formData.founderBio}
              onChange={(e) => setFormData(prev => ({ ...prev, founderBio: e.target.value }))}
              required
              disabled={isSubmitting}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              placeholder="Any other details you'd like to share (team size, funding stage, key metrics, etc.)"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              disabled={isSubmitting}
              className="min-h-[80px]"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-primary text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Founder Information'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
