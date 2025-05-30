
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  // Sample data
  const subjects = [
    { name: 'Physics', progress: 65, color: 'bg-secondary' },
    { name: 'Chemistry', progress: 78, color: 'bg-primary' },
    { name: 'Mathematics', progress: 42, color: 'bg-accent' },
  ];
  
  const recentTests = [
    { name: 'Full Mock Test #5', score: '138/300', date: '2023-05-05', percentile: 82 },
    { name: 'Physics - Electromagnetism', score: '42/60', date: '2023-05-03', percentile: 76 },
    { name: 'Chemistry - Organic', score: '53/60', date: '2023-05-01', percentile: 89 },
  ];
  
  const weakTopics = [
    { subject: 'Physics', topic: 'Rotational Dynamics', accuracy: 35 },
    { subject: 'Mathematics', topic: 'Definite Integrals', accuracy: 28 },
    { subject: 'Chemistry', topic: 'Chemical Bonding', accuracy: 42 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome Back, Student!</h1>
          <p className="text-muted-foreground">Here's an overview of your preparation progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            <strong>JEE Mains:</strong> 42 days left
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{subject.name}</CardTitle>
              <CardDescription>Overall progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{subject.progress}%</span>
                <span className="text-sm text-muted-foreground">100%</span>
              </div>
              <Progress value={subject.progress} className={subject.color} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent-tests">Recent Tests</TabsTrigger>
          <TabsTrigger value="weak-topics">Weak Topics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Your overall performance across subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Average Score</div>
                    <div>68%</div>
                  </div>
                  <Progress value={68} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Questions Attempted</div>
                    <div>764 / 1200</div>
                  </div>
                  <Progress value={63} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Time Management</div>
                    <div>72%</div>
                  </div>
                  <Progress value={72} />
                </div>
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                You're making good progress! Focus on improving your Mathematics score and time management for better results.
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Mock Tests</CardTitle>
                <CardDescription>Based on your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      PT
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Physics - Thermodynamics</p>
                      <p className="text-sm text-muted-foreground">30 questions · 45 minutes</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      MI
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Maths - Integration</p>
                      <p className="text-sm text-muted-foreground">25 questions · 40 minutes</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      FT
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Full Mock Test #6</p>
                      <p className="text-sm text-muted-foreground">90 questions · 180 minutes</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Study Plan</CardTitle>
                <CardDescription>Today's focus areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                      <span>Math: Definite Integration</span>
                    </div>
                    <span className="text-sm text-muted-foreground">90 min</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-secondary"></div>
                      <span>Physics: Rotational Mechanics</span>
                    </div>
                    <span className="text-sm text-muted-foreground">60 min</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-accent"></div>
                      <span>Chemistry: Periodic Properties</span>
                    </div>
                    <span className="text-sm text-muted-foreground">45 min</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted"></div>
                      <span>Quick Revision: Formulas</span>
                    </div>
                    <span className="text-sm text-muted-foreground">30 min</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Study Time</span>
                    <span>3hr 45min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="recent-tests">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>Your performance in recent mock tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentTests.map((test, index) => (
                  <div key={index} className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Taken on {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 md:mt-0">
                      <div>
                        <p className="text-sm font-medium">Score</p>
                        <p className="text-lg">{test.score}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Percentile</p>
                        <p className="text-lg">{test.percentile}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weak-topics">
          <Card>
            <CardHeader>
              <CardTitle>Weak Topics</CardTitle>
              <CardDescription>Focus on these areas to improve your score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {weakTopics.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{topic.topic}</p>
                        <p className="text-sm text-muted-foreground">{topic.subject}</p>
                      </div>
                      <div className="text-sm font-medium">{topic.accuracy}% accuracy</div>
                    </div>
                    <Progress value={topic.accuracy} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      Practice more questions in this topic to improve your understanding.
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
