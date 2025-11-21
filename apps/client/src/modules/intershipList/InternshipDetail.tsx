import React from 'react';
import { useJobStore } from '../../store/internShipStore';
import { Bookmark, ArrowUpRight, Share2 } from 'lucide-react';

export type InternshipFull = {
  id: string;
  title: string;
  company: string;
  location?: string;
  logo?: string;
  postedAt?: string;
  type?: string;
  category?: string;
  description?: string;
  responsibilities?: string[];
  qualifications?: string[];
};

const InternshipDetail: React.FC<{ internship: InternshipFull }> = ({ internship }) => {
  const { savedJobs, toggleSaveJob } = useJobStore();
  const isSaved = savedJobs.includes(internship.id);

  return (
    <div className="col-span-12 lg:col-span-7">
      <div className="sticky top-40 rounded-xl border border-base-300! bg-base-100! p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral!">
              {internship.logo ? <img alt={`${internship.company} logo`} className="h-9 w-9" src={internship.logo} /> : null}
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">{internship.title}</h3>
              <p className="mt-1 text-base-content">{internship.company} • {internship.location}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="badge badge-success text-base-content">{internship.type}</span>
                <span className="badge">{internship.category}</span>
              </div>
            </div>
          </div>
          <button className="text-primary" onClick={() => toggleSaveJob(internship.id)}>
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btn-primary flex h-11 flex-1 items-center justify-center gap-2">
            <ArrowUpRight size={20} />
            <span>Apply Now</span>
          </button>
          <button className="btn btn-ghost flex h-11 items-center justify-center gap-2">
            <Share2 size={20} />
            <span>Share</span>
          </button>
        </div>
        
        <div className="mt-8 border-t border-base-300! pt-6">
          <h4 className="text-lg font-bold">Job Description</h4>
          <div className="mt-4 space-y-4 text-sm text-base-content">
            <p>{internship.description}</p>
            
            {internship.responsibilities && internship.responsibilities.length > 0 && (
              <>
                <h5 className="font-bold text-base-content">Responsibilities</h5>
                <ul className="list-disc space-y-1 pl-5 text-base-content">
                  {internship.responsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            )}
            
            {internship.qualifications && internship.qualifications.length > 0 && (
              <>
                <h5 className="font-bold text-base-content">Qualifications</h5>
                <ul className="list-disc space-y-1 pl-5 text-base-content">
                  {internship.qualifications.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipDetail;
