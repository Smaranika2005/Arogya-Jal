import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, CheckCircle, XCircle, Loader2 } from "lucide-react";

const DatabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage('');
    setTestResults(null);

    try {
      // Test 1: Basic connection
      console.log('Testing Supabase connection...');
      
      // Test 2: Check if we can query the profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (profilesError) {
        throw new Error(`Profiles table error: ${profilesError.message}`);
      }

      // Test 3: Check if we can query the surveys table
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('count')
        .limit(1);

      if (surveysError) {
        throw new Error(`Surveys table error: ${surveysError.message}`);
      }

      // Test 4: Check auth status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      setTestResults({
        profilesTable: !profilesError,
        surveysTable: !surveysError,
        authStatus: !authError,
        userLoggedIn: !!user,
        profilesCount: profiles?.length || 0,
        surveysCount: surveys?.length || 0
      });

      setConnectionStatus('connected');
      console.log('✅ Database connection successful!');
      console.log('Profiles table:', !profilesError ? 'accessible' : 'error');
      console.log('Surveys table:', !surveysError ? 'accessible' : 'error');
      console.log('Auth status:', !authError ? 'working' : 'error');
      console.log('User logged in:', !!user);

    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
      console.error('❌ Database connection failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected ✓</Badge>;
      case 'error':
        return <Badge variant="destructive">Error ✗</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Connection Status:</span>
          {getStatusBadge()}
        </div>

        <Button 
          onClick={testConnection} 
          disabled={connectionStatus === 'testing'}
          className="w-full"
        >
          {connectionStatus === 'testing' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Test Database Connection
            </>
          )}
        </Button>

        {connectionStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-semibold mb-2">Connection Error:</h4>
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}

        {testResults && connectionStatus === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-800 font-semibold mb-3">✅ Connection Successful!</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Profiles Table:</span>
                <Badge variant={testResults.profilesTable ? "default" : "destructive"}>
                  {testResults.profilesTable ? "Accessible" : "Error"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Surveys Table:</span>
                <Badge variant={testResults.surveysTable ? "default" : "destructive"}>
                  {testResults.surveysTable ? "Accessible" : "Error"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Authentication:</span>
                <Badge variant={testResults.authStatus ? "default" : "destructive"}>
                  {testResults.authStatus ? "Working" : "Error"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>User Status:</span>
                <Badge variant={testResults.userLoggedIn ? "default" : "secondary"}>
                  {testResults.userLoggedIn ? "Logged In" : "Not Logged In"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Connection to Supabase database</li>
            <li>Access to profiles and surveys tables</li>
            <li>Authentication system status</li>
            <li>Current user session</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;