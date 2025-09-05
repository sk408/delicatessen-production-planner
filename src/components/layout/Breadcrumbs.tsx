import { useLocation, Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

export function Breadcrumbs() {
  const location = useLocation();
  
  // Map routes to breadcrumb names
  const routeNames: Record<string, string> = {
    '/': 'Overview',
    '/upload': 'Upload Data',
    '/configure': 'Configuration',
    '/planning': 'Planning',
    '/results': 'Results'
  };

  // Generate breadcrumb items
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    {
      name: 'Home',
      href: '/',
      current: location.pathname === '/'
    }
  ];

  // Add path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    breadcrumbs.push({
      name: routeNames[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
      current: isLast
    });
  });

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            
            <div className="flex items-center">
              {index === 0 && (
                <HomeIcon className="h-4 w-4 text-gray-400 mr-2" />
              )}
              
              {item.current ? (
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className={clsx(
                    'text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors',
                    'focus:outline-none focus:underline'
                  )}
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}


