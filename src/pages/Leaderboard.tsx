
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, ArrowUp, ArrowDown, Minus } from 'lucide-react';

// Mock leaderboard data
const leaderboardData = [
  {
    id: 1,
    name: 'Rahul Sharma',
    rank: 1,
    score: 9850,
    totalTests: 42,
    avgAccuracy: 92,
    rankChange: 0,
    avatar: 'RS'
  },
  {
    id: 2,
    name: 'Priya Patel',
    rank: 2,
    score: 9720,
    totalTests: 38,
    avgAccuracy: 89,
    rankChange: 1,
    avatar: 'PP'
  },
  {
    id: 3,
    name: 'Aditya Singh',
    rank: 3,
    score: 9650,
    totalTests: 45,
    avgAccuracy: 85,
    rankChange: -1,
    avatar: 'AS'
  },
  {
    id: 4,
    name: 'Neha Gupta',
    rank: 4,
    score: 9520,
    totalTests: 39,
    avgAccuracy: 88,
    rankChange: 2,
    avatar: 'NG'
  },
  {
    id: 5,
    name: 'Vikram Malhotra',
    rank: 5,
    score: 9480,
    totalTests: 41,
    avgAccuracy: 86,
    rankChange: -1,
    avatar: 'VM'
  },
  {
    id: 6,
    name: 'Ananya Desai',
    rank: 6,
    score: 9350,
    totalTests: 37,
    avgAccuracy: 84,
    rankChange: 0,
    avatar: 'AD'
  },
  {
    id: 7,
    name: 'Rohan Kapoor',
    rank: 7,
    score: 9210,
    totalTests: 35,
    avgAccuracy: 82,
    rankChange: 3,
    avatar: 'RK'
  },
  {
    id: 8,
    name: 'Ishaan Joshi',
    rank: 8,
    score: 9180,
    totalTests: 40,
    avgAccuracy: 80,
    rankChange: -1,
    avatar: 'IJ'
  },
  {
    id: 9,
    name: 'Meera Reddy',
    rank: 9,
    score: 9050,
    totalTests: 36,
    avgAccuracy: 83,
    rankChange: 1,
    avatar: 'MR'
  },
  {
    id: 10,
    name: 'Arjun Kumar',
    rank: 10,
    score: 8970,
    totalTests: 34,
    avgAccuracy: 81,
    rankChange: -2,
    avatar: 'AK'
  }
];

// Mock subject-wise top performers
const subjectLeaders = {
  Physics: [
    { id: 3, name: 'Aditya Singh', score: 3450, avatar: 'AS' },
    { id: 1, name: 'Rahul Sharma', score: 3380, avatar: 'RS' },
    { id: 7, name: 'Rohan Kapoor', score: 3250, avatar: 'RK' }
  ],
  Chemistry: [
    { id: 2, name: 'Priya Patel', score: 3420, avatar: 'PP' },
    { id: 5, name: 'Vikram Malhotra', score: 3360, avatar: 'VM' },
    { id: 9, name: 'Meera Reddy', score: 3280, avatar: 'MR' }
  ],
  Mathematics: [
    { id: 1, name: 'Rahul Sharma', score: 3480, avatar: 'RS' },
    { id: 4, name: 'Neha Gupta', score: 3410, avatar: 'NG' },
    { id: 6, name: 'Ananya Desai', score: 3290, avatar: 'AD' }
  ]
};

// Mock weekly challenge data
const weeklyChallenge = {
  title: "Calculus Marathon",
  description: "Complete 30 calculus problems with at least 85% accuracy",
  endDate: "May 15, 2025",
  participants: 248,
  leaderboard: [
    { id: 4, name: 'Neha Gupta', score: 92, avatar: 'NG' },
    { id: 1, name: 'Rahul Sharma', score: 90, avatar: 'RS' },
    { id: 6, name: 'Ananya Desai', score: 88, avatar: 'AD' }
  ]
};

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState('all-time');
  
  const currentUserRank = {
    rank: 42,
    name: "You (Amit Roy)",
    score: 7850,
    totalTests: 28,
    avgAccuracy: 76,
    rankChange: 5,
    avatar: 'AR'
  };
  
  const getRankChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getTrophyForRank = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="h-5 w-5 text-amber-700" />;
    } else {
      return <div className="h-5 w-5 flex items-center justify-center font-medium text-muted-foreground">{rank}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Compare your performance with peers and track your progress</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{currentUserRank.rank}</div>
              <div className="flex items-center text-sm">
                {getRankChangeIcon(currentUserRank.rankChange)}
                <span className={currentUserRank.rankChange > 0 ? 'text-green-300' : currentUserRank.rankChange < 0 ? 'text-red-300' : ''}>
                  {Math.abs(currentUserRank.rankChange)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentUserRank.score}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentUserRank.avgAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Top Performers</h2>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right hidden md:table-cell">Tests</TableHead>
                <TableHead className="text-right hidden md:table-cell">Accuracy</TableHead>
                <TableHead className="text-right hidden md:table-cell">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center justify-center">
                      {getTrophyForRank(student.rank)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{student.avatar}</AvatarFallback>
                      </Avatar>
                      <span>{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{student.score}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{student.totalTests}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{student.avgAccuracy}%</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <div className="flex items-center justify-end">
                      {getRankChangeIcon(student.rankChange)}
                      <span className="ml-1">
                        {Math.abs(student.rankChange) === 0 ? '-' : Math.abs(student.rankChange)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* User's position in leaderboard */}
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">{currentUserRank.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{currentUserRank.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{currentUserRank.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{currentUserRank.score}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{currentUserRank.totalTests}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{currentUserRank.avgAccuracy}%</TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <div className="flex items-center justify-end">
                    {getRankChangeIcon(currentUserRank.rankChange)}
                    <span className="ml-1">
                      {Math.abs(currentUserRank.rankChange) === 0 ? '-' : Math.abs(currentUserRank.rankChange)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Subject Top Performers</h2>
          <Tabs defaultValue="physics">
            <TabsList>
              <TabsTrigger value="physics">Physics</TabsTrigger>
              <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
              <TabsTrigger value="mathematics">Mathematics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="physics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Physics Leaders</CardTitle>
                  <CardDescription>Top performers in Physics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectLeaders.Physics.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            {getTrophyForRank(index + 1)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{student.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">Score: {student.score}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chemistry" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chemistry Leaders</CardTitle>
                  <CardDescription>Top performers in Chemistry</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectLeaders.Chemistry.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            {getTrophyForRank(index + 1)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{student.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">Score: {student.score}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="mathematics" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mathematics Leaders</CardTitle>
                  <CardDescription>Top performers in Mathematics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjectLeaders.Mathematics.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            {getTrophyForRank(index + 1)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{student.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">Score: {student.score}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">Weekly Challenge</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {weeklyChallenge.title}
              </CardTitle>
              <CardDescription>{weeklyChallenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ends on</span>
                  <span>{weeklyChallenge.endDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Participants</span>
                  <span>{weeklyChallenge.participants}</span>
                </div>
              </div>
              
              <h4 className="font-medium mb-2">Current Leaders</h4>
              <div className="space-y-3">
                {weeklyChallenge.leaderboard.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted">
                        {getTrophyForRank(index + 1)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>{student.avatar}</AvatarFallback>
                        </Avatar>
                        <span>{student.name}</span>
                      </div>
                    </div>
                    <div className="font-medium">{student.score}%</div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4">Join Challenge</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
