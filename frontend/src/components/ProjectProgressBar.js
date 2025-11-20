import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ProjectProgressBar = ({ project }) => {
  const { 
    project_name, 
    project_value, 
    income, 
    expenses, 
    balance,
    income_percentage, 
    expenses_percentage,
    remaining_percentage 
  } = project;

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`project-progress-${project.project_id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{project_name}</CardTitle>
          <span className="text-xs text-slate-500">Rp {project_value?.toLocaleString('id-ID')}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Income Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">Diterima</span>
            <span className="text-xs font-medium text-green-600">
              {income_percentage}% (Rp {income?.toLocaleString('id-ID')})
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(income_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Expenses Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">Dibelanjakan</span>
            <span className="text-xs font-medium text-red-600">
              {expenses_percentage}% (Rp {expenses?.toLocaleString('id-ID')})
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(expenses_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Balance */}
        <div className="pt-2 border-t flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">Saldo:</span>
          <span className={`text-sm font-bold ${
            balance >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            Rp {balance?.toLocaleString('id-ID')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectProgressBar;